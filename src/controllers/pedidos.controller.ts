"use server";

import { pedidosService } from "@/services/pedidos.service";
import { getCurrentUser } from "@/lib/session";

export async function despacharPedido(comandaId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await pedidosService.despachar(comandaId);
}

export async function confirmarEntrega(comandaId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await pedidosService.confirmarEntrega(comandaId);
}

export async function cancelarPedido(comandaId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await pedidosService.cancelar(comandaId);
}
