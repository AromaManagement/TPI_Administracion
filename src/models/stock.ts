import type { Timestamps } from "./common";

/** Unidad de medida (enum Prisma). */
export type UnidadMedida = "KG" | "G" | "L" | "ML" | "UNIDAD" | "PORCION";

/** Etiquetas legibles para las unidades de medida. */
export const UNIDADES_MEDIDA: Record<UnidadMedida, string> = {
  KG: "Kilogramo",
  G: "Gramo",
  L: "Litro",
  ML: "Mililitro",
  UNIDAD: "Unidad",
  PORCION: "Porción",
};

/** Tipo de movimiento de stock (enum Prisma). */
export type TipoMov = "INGRESO" | "EGRESO" | "AJUSTE" | "MERMA";

/** Etiquetas legibles para los tipos de movimiento. */
export const TIPOS_MOV: Record<TipoMov, string> = {
  INGRESO: "Ingreso",
  EGRESO: "Egreso",
  AJUSTE: "Ajuste",
  MERMA: "Merma",
};

/**
 * Modelo `articulo` del schema Prisma.
 * Un artículo puede ser un ingrediente o un producto vendible.
 */
export interface Articulo extends Timestamps {
  id: number;
  nombre: string;
  descripcion: string | null;
  esIngrediente: boolean;
  cantidad: number | null;
  unidadMedida: UnidadMedida | null;
  stock?: Stock | null;
}

/** Modelo `stock` del schema Prisma. */
export interface Stock extends Timestamps {
  id: number;
  articuloId: number;
  cantidad: number;
  minimo: number | null;
  articulo?: Articulo;
}

/** Modelo `movimiento_stock` del schema Prisma. */
export interface MovimientoStock extends Timestamps {
  id: number;
  stockId: number;
  tipoMov: TipoMov;
  cantidad: number;
  fecha: string;
  stock?: Stock;
}
