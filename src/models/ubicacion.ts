import type { Timestamps } from "./common";

/** Modelo `direccion` del schema Prisma. */
export interface Direccion extends Timestamps {
  id: number;
  barrio: string | null;
  calle: string | null;
  manzanaPiso: string | null;
  numeracion: string | null;
  referencia: string | null;
  casaDepto: string | null;
  lat: number | null;
  lng: number | null;
  etiqueta: string | null;
}
