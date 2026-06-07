"use server";

import { revalidatePath } from "next/cache";
import { cartaService } from "@/services/carta.service";
import {
  seccionSchema,
  seccionUpdateSchema,
  platoSchema,
  platoUpdateSchema,
} from "@/lib/validators";
import { validate, toFailure, field, numberField } from "./helpers";
import type { ActionResult, Seccion, Plato } from "@/models";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function revalidate() {
  revalidatePath("/carta");
}

function extractImagen(formData: FormData): { changed: boolean; dataUrl: string | null } {
  const changed = formData.get("imagenChanged") === "1";
  if (!changed) return { changed: false, dataUrl: null };
  const raw = formData.get("imagenDataUrl");
  const dataUrl = typeof raw === "string" && raw.startsWith("data:") ? raw : null;
  return { changed: true, dataUrl };
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

export async function createSeccionAction(
  _prev: ActionResult<Seccion> | null,
  formData: FormData,
): Promise<ActionResult<Seccion>> {
  const parsed = validate(seccionSchema, {
    nombre: field(formData, "nombre"),
    detalle: field(formData, "detalle"),
  });
  if (!parsed.ok) return parsed;

  try {
    const seccion = await cartaService.createSeccion(parsed.data);
    revalidate();
    return { ok: true, data: seccion, message: "Sección creada correctamente." };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateSeccionAction(
  id: number,
  _prev: ActionResult<Seccion> | null,
  formData: FormData,
): Promise<ActionResult<Seccion>> {
  const parsed = validate(seccionUpdateSchema, {
    nombre: field(formData, "nombre"),
    detalle: field(formData, "detalle"),
  });
  if (!parsed.ok) return parsed;

  try {
    const seccion = await cartaService.updateSeccion(id, parsed.data);
    revalidate();
    return { ok: true, data: seccion, message: "Sección actualizada correctamente." };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteSeccionAction(id: number): Promise<ActionResult> {
  try {
    await cartaService.deleteSeccion(id);
    revalidate();
    return { ok: true, data: undefined, message: "Sección eliminada." };
  } catch (error) {
    return toFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Platos
// ---------------------------------------------------------------------------

export async function createPlatoAction(
  _prev: ActionResult<Plato> | null,
  formData: FormData,
): Promise<ActionResult<Plato>> {
  const parsed = validate(platoSchema, {
    seccionId: numberField(formData, "seccionId"),
    nombre: field(formData, "nombre"),
    precio: field(formData, "precio"),
    detalle: field(formData, "detalle"),
  });
  if (!parsed.ok) return parsed;

  try {
    const { dataUrl } = extractImagen(formData);
    const plato = await cartaService.createPlato({ ...parsed.data, imagenSi: dataUrl });
    revalidate();
    return { ok: true, data: plato, message: "Plato creado correctamente." };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updatePlatoAction(
  id: number,
  _prev: ActionResult<Plato> | null,
  formData: FormData,
): Promise<ActionResult<Plato>> {
  const parsed = validate(platoUpdateSchema, {
    nombre: field(formData, "nombre"),
    precio: field(formData, "precio"),
    detalle: field(formData, "detalle"),
  });
  if (!parsed.ok) return parsed;

  try {
    const { changed, dataUrl } = extractImagen(formData);
    const plato = await cartaService.updatePlato(id, {
      ...parsed.data,
      ...(changed ? { imagenSi: dataUrl } : {}),
    });
    revalidate();
    return { ok: true, data: plato, message: "Plato actualizado correctamente." };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deletePlatoAction(id: number): Promise<ActionResult> {
  try {
    await cartaService.deletePlato(id);
    revalidate();
    return { ok: true, data: undefined, message: "Plato eliminado." };
  } catch (error) {
    return toFailure(error);
  }
}
