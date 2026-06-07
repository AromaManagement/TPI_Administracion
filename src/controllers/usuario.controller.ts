"use server";

import { revalidatePath } from "next/cache";
import { usuarioService } from "@/services/usuario.service";
import { usuarioSchema, usuarioUpdateSchema } from "@/lib/validators";
import { validate, toFailure, field } from "./helpers";
import type { ActionResult, Usuario } from "@/models";

export async function createUsuarioAction(
  _prev: ActionResult<Usuario> | null,
  formData: FormData,
): Promise<ActionResult<Usuario>> {
  const parsed = validate(usuarioSchema, {
    correo: field(formData, "correo"),
    contrasena: field(formData, "contrasena"),
    nombre: field(formData, "nombre"),
    apellido: field(formData, "apellido"),
    rol: field(formData, "rol"),
  });
  if (!parsed.ok) return parsed;

  try {
    const usuario = await usuarioService.create(parsed.data);
    revalidatePath("/usuarios");
    return { ok: true, data: usuario, message: "Usuario creado correctamente." };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateUsuarioAction(
  id: number,
  _prev: ActionResult<Usuario> | null,
  formData: FormData,
): Promise<ActionResult<Usuario>> {
  const parsed = validate(usuarioUpdateSchema, {
    correo: field(formData, "correo"),
    contrasena: field(formData, "contrasena"),
    nombre: field(formData, "nombre"),
    apellido: field(formData, "apellido"),
    rol: field(formData, "rol"),
  });
  if (!parsed.ok) return parsed;

  try {
    const usuario = await usuarioService.update(id, parsed.data);
    revalidatePath("/usuarios");
    return { ok: true, data: usuario, message: "Usuario actualizado correctamente." };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteUsuarioAction(id: number): Promise<ActionResult> {
  try {
    await usuarioService.remove(id);
    revalidatePath("/usuarios");
    return { ok: true, data: undefined, message: "Usuario eliminado." };
  } catch (error) {
    return toFailure(error);
  }
}
