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

/** Un ingrediente de la receta de un plato, enriquecido con datos del stock. */
export interface PlatoIngrediente {
  articuloId: number;
  nombre: string;
  cantidad: number;
  unidadMedida: string | null;
  stockActual: number;
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
  /** Ingredientes de la receta (vacío = sin receta definida). */
  ingredientes?: PlatoIngrediente[];
  /** true = stock ok, false = falta stock, null = sin receta. */
  disponible?: boolean | null;
}
