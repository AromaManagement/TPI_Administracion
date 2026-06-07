import type { Timestamps } from "./common";

/** Modelo `imagen` del schema Prisma. */
export interface Imagen extends Timestamps {
  id: number;
  imagenSi: string;
}

/** Modelo `carta` del schema Prisma. */
export interface Carta extends Timestamps {
  id: number;
  fechaDesde: string;
  fechaHasta: string | null;
  secciones?: Seccion[];
}

/**
 * Modelo `secciones` del schema Prisma.
 * Representa las categorías de la carta (Entradas, Plato Principal, Postre, Bebidas).
 */
export interface Seccion extends Timestamps {
  id: number;
  cartaId: number;
  nombre: string;
  detalle: string | null;
  platos?: Plato[];
}

/** Modelo `platos` del schema Prisma (los productos de la carta). */
export interface Plato extends Timestamps {
  id: number;
  seccionId: number;
  nombre: string | null;
  precio: number | null;
  detalle: string | null;
  imagenId: number | null;
  seccion?: Seccion;
  imagen?: Imagen | null;
}

/** Categorías de carta indicadas en requirements.md. */
export const SECCIONES_CARTA = [
  "Entradas",
  "Plato Principal",
  "Postre",
  "Bebidas",
] as const;
