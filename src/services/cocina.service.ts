import "server-only";
import fs from "fs/promises";
import path from "path";
import type { CocinaComanda, CocinaDetalle, EstadoComanda } from "@/models";
import { recetaService } from "./receta.service";
import { stockService } from "./stock.service";

// ---------------------------------------------------------------------------
// Shared local file store. To connect the real backend replace each method
// with the corresponding fetch() call.
// ---------------------------------------------------------------------------

const DATA_PATH = path.resolve(process.cwd(), "..", "mock-data", "cocina.json");

interface PersistedData {
  comandas: CocinaComanda[];
  nextIds: { comanda: number; detalle: number; comandaAplicacion: number };
}

const INITIAL: PersistedData = {
  comandas: [],
  nextIds: { comanda: 200, detalle: 2000, comandaAplicacion: 2 },
};

let _cache: PersistedData | null = null;

async function load(): Promise<PersistedData> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    _cache = JSON.parse(raw) as PersistedData;
    // Back-compat: add nextIds if missing from old data
    if (!_cache.nextIds) {
      _cache.nextIds = { comanda: 200, detalle: 2000, comandaAplicacion: 2 };
    }
    return _cache;
  } catch {
    _cache = structuredClone(INITIAL);
    await save(_cache);
    return _cache;
  }
}

async function save(data: PersistedData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function ts() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function deriveEstado(detalles: CocinaDetalle[]): EstadoComanda {
  if (detalles.length === 0) return "SIN_ASIGNAR";
  if (detalles.every((d) => d.estado === "LISTO")) return "LISTO";
  if (detalles.some((d) => d.estado !== "SIN_ASIGNAR")) return "EN_COCINA";
  return "SIN_ASIGNAR";
}

// ---------------------------------------------------------------------------
// Presets para simular pedidos entrantes desde la app de delivery
// ---------------------------------------------------------------------------

interface PedidoPreset {
  clienteNombre: string;
  direccion: string;
  platos: { platoId: number; platoNombre: string; precioUnitario: number }[];
}

const PRESETS: PedidoPreset[] = [
  {
    clienteNombre: "Ana García",
    direccion: "Rivadavia 456, 2A — General Paz",
    platos: [
      { platoId: 1, platoNombre: "Empanadas mendocinas (x3)", precioUnitario: 3500 },
      { platoId: 9, platoNombre: "Gaseosa 1L", precioUnitario: 1200 },
    ],
  },
  {
    clienteNombre: "Pedro Rodríguez",
    direccion: "Independencia 789, PB — Nueva Córdoba",
    platos: [
      { platoId: 5, platoNombre: "Milanesa napolitana", precioUnitario: 11800 },
      { platoId: 10, platoNombre: "Agua mineral 500ml", precioUnitario: 800 },
    ],
  },
  {
    clienteNombre: "Sofía Martín",
    direccion: "Colón 123, 5B — Centro",
    platos: [
      { platoId: 4, platoNombre: "Bife de chorizo con papas", precioUnitario: 14500 },
      { platoId: 9, platoNombre: "Gaseosa 1L", precioUnitario: 1200 },
    ],
  },
  {
    clienteNombre: "Lucas Fernández",
    direccion: "Lima 321, 1A — Güemes",
    platos: [
      { platoId: 5, platoNombre: "Milanesa napolitana", precioUnitario: 11800 },
      { platoId: 4, platoNombre: "Bife de chorizo con papas", precioUnitario: 14500 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const cocinaService = {
  /** Returns all active comandas ordered by fechaSolicitud ascending. */
  getCocina: async (): Promise<CocinaComanda[]> => {
    const { comandas } = await load();
    return JSON.parse(JSON.stringify(
      [...comandas]
        .filter((c) => !c.deletedAt)
        .sort(
          (a, b) => new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime()
        )
    )) as CocinaComanda[];
  },

  /** Assign a cook to a detalle. Transitions estado → EN_PROCESO. */
  asignarDetalle: async (
    detalleId: number,
    empleadoId: number,
    empleadoNombre: string
  ): Promise<void> => {
    const d = await load();
    let updated = false;

    for (const comanda of d.comandas) {
      const detalle = comanda.detalles.find((det) => det.id === detalleId);
      if (!detalle) continue;
      if (detalle.estado !== "SIN_ASIGNAR") break;

      detalle.empleadoId = empleadoId;
      detalle.empleadoNombre = empleadoNombre;
      detalle.estado = "EN_PROCESO";
      detalle.updatedAt = ts();

      comanda.estadoComanda = deriveEstado(comanda.detalles);
      comanda.updatedAt = ts();
      updated = true;
      break;
    }

    if (updated) await save(d);
  },

  /** Unassign a cook from a detalle. Transitions estado → SIN_ASIGNAR. */
  desasignarDetalle: async (detalleId: number): Promise<void> => {
    const d = await load();
    let updated = false;

    for (const comanda of d.comandas) {
      const detalle = comanda.detalles.find((det) => det.id === detalleId);
      if (!detalle) continue;
      if (detalle.estado !== "EN_PROCESO") break;

      detalle.empleadoId = null;
      detalle.empleadoNombre = null;
      detalle.estado = "SIN_ASIGNAR";
      detalle.updatedAt = ts();

      comanda.estadoComanda = deriveEstado(comanda.detalles);
      comanda.updatedAt = ts();
      updated = true;
      break;
    }

    if (updated) await save(d);
  },

  /**
   * Mark a detalle as done. Transitions estado → LISTO.
   * Deducts ingredients from stock via EGRESO movements.
   * If all detalles of the comanda are LISTO, the comanda becomes LISTO too.
   */
  completarDetalle: async (detalleId: number): Promise<void> => {
    const d = await load();
    let updated = false;
    let platoId: number | null = null;

    for (const comanda of d.comandas) {
      const detalle = comanda.detalles.find((det) => det.id === detalleId);
      if (!detalle) continue;
      if (detalle.estado === "LISTO") break;

      platoId = detalle.platoId;
      detalle.estado = "LISTO";
      detalle.updatedAt = ts();

      comanda.estadoComanda = deriveEstado(comanda.detalles);
      comanda.updatedAt = ts();
      updated = true;
      break;
    }

    if (updated) {
      await save(d);

      // Deduct ingredients from stock
      if (platoId !== null) {
        const ingredientes = await recetaService.getIngredientes(platoId);
        for (const { articuloId, cantidad } of ingredientes) {
          await stockService.registrarMovimiento(articuloId, {
            tipoMov: "EGRESO",
            cantidad,
            fecha: today(),
          });
        }
      }
    }
  },

  /**
   * Simulate a new delivery order arriving from the app.
   * Cycles through PRESETS. Returns the new CocinaComanda.
   */
  simularPedido: async (): Promise<CocinaComanda> => {
    const d = await load();
    const presetIndex = d.comandas.filter((c) => !c.deletedAt).length % PRESETS.length;
    const preset = PRESETS[presetIndex];
    const now = ts();

    const comandaId = d.nextIds.comanda++;
    const comandaAplicacionId = d.nextIds.comandaAplicacion++;

    const detalles: CocinaDetalle[] = preset.platos.map(() => ({
      id: d.nextIds.detalle++,
      comandaId,
      platoId: 0, // assigned below
      platoNombre: "",
      empleadoId: null,
      empleadoNombre: null,
      estado: "SIN_ASIGNAR" as const,
      precioUnitario: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    // Assign plato data properly
    preset.platos.forEach((p, i) => {
      detalles[i].platoId = p.platoId;
      detalles[i].platoNombre = p.platoNombre;
      detalles[i].precioUnitario = p.precioUnitario;
    });

    const comanda: CocinaComanda = {
      id: comandaId,
      clienteNombre: preset.clienteNombre,
      estadoComanda: "SIN_ASIGNAR",
      fechaSolicitud: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      comandaAplicacionId,
      direccion: preset.direccion,
      detalles,
    };

    d.comandas.push(comanda);
    await save(d);

    return JSON.parse(JSON.stringify(comanda)) as CocinaComanda;
  },
};
