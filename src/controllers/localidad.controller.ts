"use server";

import { revalidatePath } from "next/cache";
import { localidadService } from "@/services/localidad.service";
import { localidadSchema } from "@/lib/validators";
import { validate, toFailure, field } from "./helpers";
import type { ActionResult, Localidad } from "@/models";

/** CONTROLLER de localidades (server actions). */

export async function createLocalidadAction(
  _prev: ActionResult<Localidad> | null,
  formData: FormData,
): Promise<ActionResult<Localidad>> {
  const parsed = validate(localidadSchema, { nombre: field(formData, "nombre") });
  if (!parsed.ok) return parsed;

  try {
    const localidad = await localidadService.create(parsed.data);
    revalidatePath("/localidades");
    return {
      ok: true,
      data: localidad,
      message: "Localidad creada correctamente.",
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateLocalidadAction(
  id: number,
  _prev: ActionResult<Localidad> | null,
  formData: FormData,
): Promise<ActionResult<Localidad>> {
  const parsed = validate(localidadSchema, { nombre: field(formData, "nombre") });
  if (!parsed.ok) return parsed;

  try {
    const localidad = await localidadService.update(id, parsed.data);
    revalidatePath("/localidades");
    return {
      ok: true,
      data: localidad,
      message: "Localidad actualizada correctamente.",
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteLocalidadAction(id: number): Promise<ActionResult> {
  try {
    await localidadService.remove(id);
    revalidatePath("/localidades");
    return { ok: true, data: undefined, message: "Localidad eliminada." };
  } catch (error) {
    return toFailure(error);
  }
}
