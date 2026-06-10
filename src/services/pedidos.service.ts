import "server-only";
import { api } from "@/lib/api";
import type { PedidoDelivery, EstadoComanda } from "@/models";

interface BackendDetalle {
  id: number;
  platoId: number;
  precioUnitario: string | number;
  deletedAt: string | null;
  plato?: { id: number; nombre: string; precio: number } | null;
}

interface BackendDireccion {
  barrio: string | null;
  calle: string | null;
  numeracion: string | null;
  referencia: string | null;
}

interface BackendComanda {
  id: number;
  estadoComanda: string | null;
  fechaSolicitud: string;
  repartidorId: number | null;
  direccionId: number | null;
  cliente: { nombre: string; apellido: string } | null;
  detalles: BackendDetalle[];
  direccion: BackendDireccion | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function formatDireccion(d: BackendDireccion | null): string {
  if (!d) return "Sin dirección";
  return [d.calle, d.numeracion, d.barrio].filter(Boolean).join(", ") || "Sin dirección";
}

function toPedido(bc: BackendComanda): PedidoDelivery {
  const detalles = bc.detalles
    .filter((d) => !d.deletedAt)
    .map((d) => ({
      platoNombre: d.plato?.nombre ?? `Plato #${d.platoId}`,
      precioUnitario: Number(d.precioUnitario),
    }));

  return {
    comandaId: bc.id,
    clienteNombre: bc.cliente
      ? `${bc.cliente.nombre} ${bc.cliente.apellido}`
      : "Cliente",
    fechaSolicitud: bc.fechaSolicitud,
    direccion: formatDireccion(bc.direccion),
    detalles,
    total: detalles.reduce((sum, d) => sum + d.precioUnitario, 0),
    estadoComanda: (bc.estadoComanda ?? "LISTO") as EstadoComanda,
    repartidorId: bc.repartidorId,
  };
}

// ---------------------------------------------------------------------------
// Service
//
async function fetchPorEstado(estado: EstadoComanda): Promise<BackendComanda[]> {
  return api.get<BackendComanda[]>(`/comandas/estado/${estado}`);
}

// Pedidos delivery: LISTO (listos para despacho) + EN_CAMINO + ENTREGADO
const ESTADOS_DELIVERY: EstadoComanda[] = ["LISTO", "EN_CAMINO", "ENTREGADO"];

export const pedidosService = {
  getPedidos: async (): Promise<PedidoDelivery[]> => {
    const results = await Promise.all(ESTADOS_DELIVERY.map(fetchPorEstado));
    return results
      .flat()
      .sort(
        (a, b) =>
          new Date(a.fechaSolicitud).getTime() -
          new Date(b.fechaSolicitud).getTime(),
      )
      .map(toPedido);
  },

  despachar: async (comandaId: number): Promise<void> => {
    await api.patch(`/comandas/${comandaId}/estado`, { nuevoEstado: "EN_CAMINO" });
  },

  confirmarEntrega: async (comandaId: number): Promise<void> => {
    await api.patch(`/comandas/${comandaId}/estado`, { nuevoEstado: "ENTREGADO" });
  },

  cancelar: async (comandaId: number): Promise<void> => {
    await api.patch(`/comandas/${comandaId}/estado`, { nuevoEstado: "CANCELADO" });
  },
};
