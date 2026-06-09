"use server";

import { getCurrentUser } from "@/lib/session";
import { cocinaService } from "@/services/cocina.service";

export async function tomarComanda(comandaId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await cocinaService.tomarComanda(comandaId);
}

export async function completarComanda(comandaId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await cocinaService.completarComanda(comandaId);
}
