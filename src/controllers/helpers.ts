import "server-only";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import type { ActionResult } from "@/models";

/**
 * Utilidades compartidas por los CONTROLLERS (server actions).
 *
 * Un controller: (1) valida la entrada con zod, (2) llama al/los service(s),
 * (3) traduce errores a un `ActionResult` uniforme que la vista puede consumir
 * sin try/catch.
 */

/** Convierte cualquier error en un ActionResult de fallo. */
export function toFailure(error: unknown): ActionResult<never> {
  if (error instanceof ApiError) {
    return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Error inesperado." };
}

/** Valida `data` contra `schema`; devuelve los datos o un fallo con fieldErrors. */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
):
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };

  const flat = z.flattenError(result.error);
  return {
    ok: false,
    error: "Hay errores de validación en el formulario.",
    fieldErrors: flat.fieldErrors as Record<string, string[]>,
  };
}

/** Extrae un campo string de un FormData (o undefined si está vacío). */
export function field(form: FormData, name: string): string | undefined {
  const value = form.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Igual que field pero convertido a número (o undefined). */
export function numberField(form: FormData, name: string): number | undefined {
  const value = field(form, name);
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}
