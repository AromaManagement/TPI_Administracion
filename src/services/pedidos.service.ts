import "server-only";
import fs from "fs/promises";
import path from "path";
import type { PedidoDelivery, EstadoRecorrido } from "@/models";
import { cocinaService } from "./cocina.service";

// ---------------------------------------------------------------------------
// File store for recorridos. Replace each method with fetch() when the
// backend is ready.
// ---------------------------------------------------------------------------

const DATA_PATH = path.resolve(process.cwd(), "..", "mock-data", "pedidos.json");

interface RecorridoRecord {
  id: number;
  comandaAplicacionId: number;
  estado: EstadoRecorrido;
  fechaIn: string | null;
  fechaFin: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface PedidosData {
  recorridos: RecorridoRecord[];
  nextIds: { recorrido: number };
}

let _cache: PedidosData | null = null;

async function load(): Promise<PedidosData> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    _cache = JSON.parse(raw) as PedidosData;
    return _cache;
  } catch {
    _cache = { recorridos: [], nextIds: { recorrido: 1 } };
    await save(_cache);
    return _cache;
  }
}

async function save(data: PedidosData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function ts() { return new Date().toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const pedidosService = {
  /**
   * Returns all delivery comandas that are LISTO, joined with their latest
   * active recorrido (if any).
   */
  getPedidos: async (): Promise<PedidoDelivery[]> => {
    const [comandas, pd] = await Promise.all([cocinaService.getCocina(), load()]);

    const deliveryComandas = comandas.filter(
      (c) => c.estadoComanda === "LISTO" && c.comandaAplicacionId != null
    );

    return deliveryComandas.map((c) => {
      const recorridoRecord = pd.recorridos
        .filter((r) => r.comandaAplicacionId === c.comandaAplicacionId && !r.deletedAt)
        .sort((a, b) => b.id - a.id)[0] ?? null;

      const total = c.detalles.reduce((sum, d) => sum + d.precioUnitario, 0);

      return {
        comandaId: c.id,
        comandaAplicacionId: c.comandaAplicacionId!,
        clienteNombre: c.clienteNombre ?? "Cliente",
        fechaSolicitud: c.fechaSolicitud,
        direccion: c.direccion ?? "Sin dirección",
        detalles: c.detalles.map((d) => ({
          platoNombre: d.platoNombre,
          precioUnitario: d.precioUnitario,
        })),
        total,
        recorrido: recorridoRecord
          ? {
              id: recorridoRecord.id,
              estado: recorridoRecord.estado,
              fechaIn: recorridoRecord.fechaIn,
              fechaFin: recorridoRecord.fechaFin,
            }
          : null,
      };
    });
  },

  /**
   * Start a delivery: creates an EN_CAMINO recorrido for the given
   * comandaAplicacionId. Returns the real recorrido ID.
   */
  despachar: async (comandaAplicacionId: number): Promise<RecorridoPedido> => {
    const d = await load();
    const now = ts();
    const id = d.nextIds.recorrido++;
    const rec: RecorridoRecord = {
      id,
      comandaAplicacionId,
      estado: "EN_CAMINO",
      fechaIn: today(),
      fechaFin: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    d.recorridos.push(rec);
    await save(d);
    return { id: rec.id, estado: rec.estado, fechaIn: rec.fechaIn, fechaFin: rec.fechaFin };
  },

  /** Mark the recorrido as ENTREGADO and set fechaFin. */
  confirmarEntrega: async (recorridoId: number): Promise<void> => {
    const d = await load();
    const rec = d.recorridos.find((r) => r.id === recorridoId);
    if (!rec) throw new Error(`Recorrido ${recorridoId} no encontrado.`);
    rec.estado = "ENTREGADO";
    rec.fechaFin = today();
    rec.updatedAt = ts();
    await save(d);
  },

  /** Cancel the recorrido. */
  cancelarRecorrido: async (recorridoId: number): Promise<void> => {
    const d = await load();
    const rec = d.recorridos.find((r) => r.id === recorridoId);
    if (!rec) throw new Error(`Recorrido ${recorridoId} no encontrado.`);
    rec.estado = "CANCELADO";
    rec.updatedAt = ts();
    await save(d);
  },
};
