import "server-only";
import fs from "fs/promises";
import path from "path";
import type { CocinaComanda, CocinaDetalle, EstadoComanda, EstadoDetalle } from "@/models";

// ---------------------------------------------------------------------------
// Shared local file store. To connect the real backend replace each method
// with the corresponding fetch() call.
// ---------------------------------------------------------------------------

const DATA_PATH = path.resolve(process.cwd(), "..", "mock-data", "cocina.json");

interface PersistedData {
  comandas: CocinaComanda[];
}

const INITIAL: PersistedData = { comandas: [] };

let _cache: PersistedData | null = null;

async function load(): Promise<PersistedData> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    _cache = JSON.parse(raw) as PersistedData;
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

function deriveEstado(detalles: CocinaDetalle[]): EstadoComanda {
  if (detalles.length === 0) return "SIN_ASIGNAR";
  if (detalles.every((d) => d.estado === "LISTO")) return "LISTO";
  if (detalles.some((d) => d.estado !== "SIN_ASIGNAR")) return "EN_COCINA";
  return "SIN_ASIGNAR";
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const cocinaService = {
  /** Returns all active comandas ordered by fechaSolicitud ascending. */
  getCocina: async (): Promise<CocinaComanda[]> => {
    const { comandas } = await load();
    return JSON.parse(JSON.stringify(
      [...comandas].sort(
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

  /** Mark a detalle as done. Transitions estado → LISTO.
   *  If all detalles of the comanda are LISTO, the comanda becomes LISTO too. */
  completarDetalle: async (detalleId: number): Promise<void> => {
    const d = await load();
    let updated = false;

    for (const comanda of d.comandas) {
      const detalle = comanda.detalles.find((det) => det.id === detalleId);
      if (!detalle) continue;
      if (detalle.estado === "LISTO") break;

      detalle.estado = "LISTO";
      detalle.updatedAt = ts();

      comanda.estadoComanda = deriveEstado(comanda.detalles);
      comanda.updatedAt = ts();
      updated = true;
      break;
    }

    if (updated) await save(d);
  },
};
