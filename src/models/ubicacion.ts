import type { Timestamps } from "./common";

/** Modelo `localidad` del schema Prisma. */
export interface Localidad extends Timestamps {
  id: number;
  nombre: string;
}

/** Modelo `direccion` del schema Prisma. */
export interface Direccion extends Timestamps {
  id: number;
  barrio: string | null;
  calle: string | null;
  manzanaPiso: string | null;
  numeracion: string | null;
  referencia: string | null;
  casaDepto: string | null;
  localidadId: number;
  localidad?: Localidad;
}
