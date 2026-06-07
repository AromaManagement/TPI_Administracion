"use server";

import { pedidosService } from "@/services/pedidos.service";
import { getCurrentUser } from "@/lib/session";

export async function despacharPedido(comandaAplicacionId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  return pedidosService.despachar(comandaAplicacionId);
}

export async function confirmarEntrega(recorridoId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await pedidosService.confirmarEntrega(recorridoId);
}

export async function cancelarRecorrido(recorridoId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await pedidosService.cancelarRecorrido(recorridoId);
}
