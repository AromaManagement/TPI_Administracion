"use server";

import { getCurrentUser } from "@/lib/session";
import { cocinaService } from "@/services/cocina.service";

export async function asignarDetalle(detalleId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  // TODO: restrict to Rol.COCINERO when connecting real backend
  await cocinaService.asignarDetalle(
    detalleId,
    user.id,
    `${user.nombre} ${user.apellido}`
  );
}

export async function desasignarDetalle(detalleId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await cocinaService.desasignarDetalle(detalleId);
}

export async function completarDetalle(detalleId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado.");
  await cocinaService.completarDetalle(detalleId);
}
