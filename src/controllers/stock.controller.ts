"use server";

import type { ArticuloStock } from "@/models";
import { stockService, type CreateArticuloInput, type UpdateArticuloInput, type MovimientoInput } from "@/services/stock.service";

export async function createArticulo(input: CreateArticuloInput): Promise<ArticuloStock> {
  return stockService.createArticulo(input);
}

export async function updateArticulo(id: number, input: UpdateArticuloInput): Promise<void> {
  await stockService.updateArticulo(id, input);
}

export async function deleteArticulo(id: number): Promise<void> {
  await stockService.deleteArticulo(id);
}

export async function registrarMovimiento(articuloId: number, input: MovimientoInput): Promise<void> {
  await stockService.registrarMovimiento(articuloId, input);
}
