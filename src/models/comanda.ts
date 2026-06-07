import type { Timestamps } from "./common";
import type { Usuario } from "./usuario";
import type { Direccion } from "./ubicacion";
import type { Plato } from "./carta";

/** Modelo `cliente` del schema Prisma (usuario con rol CLIENTE). */
export interface Cliente extends Timestamps {
  id: number;
  usuarioId: number;
  usuario?: Usuario;
}

/** Estado de una comanda (enum Prisma). */
export type EstadoComanda =
  | "SIN_ASIGNAR"
  | "ASIGNADO"
  | "EN_COCINA"
  | "LISTO";

/** Estado de un recorrido de delivery (enum Prisma). */
export type EstadoRecorrido =
  | "PENDIENTE"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

/**
 * Modelo `comanda` del schema Prisma.
 * Pedido genérico que se especializa en delivery (comanda_aplicacion).
 */
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
  comandaAplicacion?: ComandaAplicacion | null;
}

/** Modelo `detalle_comanda` del schema Prisma. */
export interface DetalleComanda extends Timestamps {
  id: number;
  comandaId: number;
  platoId: number;
  cantidad: number;
  precioUnitario: number;
  plato?: Plato;
}

/** Modelo `comanda_aplicacion` del schema Prisma (pedidos por delivery). */
export interface ComandaAplicacion extends Timestamps {
  id: number;
  comandaId: number;
  direccionId: number | null;
  direccion?: Direccion | null;
  recorridos?: Recorrido[];
}

/** Modelo `recorrido` del schema Prisma (seguimiento del delivery). */
export interface Recorrido extends Timestamps {
  id: number;
  comandaAplicacionId: number | null;
  repartidorId: number | null;
  fechaFin: string | null;
  fechaIn: string | null;
  coordIn: string | null;
  coordFin: string | null;
  estado: EstadoRecorrido | null;
}

/** Estados de un plato en cocina (para el módulo de Cocina). */
export const ESTADOS_PLATO = [
  "SIN_ASIGNAR",
  "ASIGNADO",
  "EN_COCINA",
  "ENTREGADO",
] as const;

export type EstadoPlato = (typeof ESTADOS_PLATO)[number];
