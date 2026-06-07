import type { Timestamps } from "./common";

/** Modelo `imagen` del schema Prisma. */
export interface Imagen extends Timestamps {
  id: number;
  imagenSi: string;
}

/** Modelo `carta` del schema Prisma. */
export interface Carta extends Timestamps {
  id: number;
  secciones?: Seccion[];
}

/** Modelo `secciones` del schema Prisma. */
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
  nombre: string;
  precio: number;
  detalle: string | null;
  imagenId: number | null;
  imagen?: Imagen | null;
}
