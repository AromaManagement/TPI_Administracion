import type { Timestamps } from "./common";
import type { Usuario } from "./usuario";

/** Estado de una comanda — refleja el enum EstadoComanda del backend. */
export type EstadoComanda =
  | "SIN_ASIGNAR"
  | "EN_COCINA"
  | "LISTO"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

/** Estado de un recorrido de delivery (legacy — se mantiene para la vista de pedidos). */
export type EstadoRecorrido = "PENDIENTE" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";

// ---------------------------------------------------------------------------
// Tipos del módulo de cocina
// ---------------------------------------------------------------------------

/** Detalle de comanda tal como lo devuelve el backend (con joins a plato y empleado). */
export type EstadoDetalle = "SIN_ASIGNAR" | "EN_COCINA" | "LISTO";

export interface CocinaDetalle {
  id: number;
  platoId: number;
  platoNombre: string;
  empleadoId: number | null;
  empleadoNombre: string | null;
  precioUnitario: number;
  estadoDetalle: EstadoDetalle;
}

/** Comanda enriquecida para la vista de cocina. */
export interface CocinaComanda {
  id: number;
  clienteNombre: string | null;
  estadoComanda: EstadoComanda;
  fechaSolicitud: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  detalles: CocinaDetalle[];
  direccion: string | null;
  repartidorId: number | null;
}

// ---------------------------------------------------------------------------
// Tipos del módulo de pedidos delivery
// ---------------------------------------------------------------------------

/** Vista de un pedido delivery para la UI de administración. */
export interface PedidoDelivery {
  comandaId: number;
  clienteNombre: string;
  fechaSolicitud: string;
  direccion: string;
  detalles: { platoNombre: string; precioUnitario: number }[];
  total: number;
  estadoComanda: EstadoComanda;
  repartidorId: number | null;
}

// ---------------------------------------------------------------------------
// Tipos heredados (mantener mientras haya referencias en otros módulos)
// ---------------------------------------------------------------------------

export interface Cliente extends Timestamps {
  id: number;
  usuarioId: number;
  usuario?: Usuario;
}

export interface Comanda extends Timestamps {
  id: number;
  empleadoId: number | null;
  clienteId: number | null;
  estadoComanda: EstadoComanda | null;
  fechaSolicitud: string;
  fechaEntrega: string | null;
  empleado?: Usuario | null;
  cliente?: Cliente | null;
  detalles?: DetalleComanda[];
}

export interface DetalleComanda extends Timestamps {
  id: number;
  comandaId: number;
  platoId: number;
  cantidad: number;
  precioUnitario: number;
}

/** @deprecated — el backend no tiene RecorridoPedido; queda por referencias en pedidos-view */
export interface RecorridoPedido {
  id: number;
  estado: EstadoRecorrido;
  fechaIn: string | null;
  fechaFin: string | null;
}
