"use server";

import { redirect } from "next/navigation";
import { authService } from "@/services/auth.service";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema } from "@/lib/validators";
import { validate, toFailure, field } from "./helpers";
import { PANEL_ROLES } from "@/models";
import type { ActionResult } from "@/models";

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = validate(loginSchema, {
    correo: field(formData, "correo"),
    contrasena: field(formData, "contrasena"),
  });
  if (!parsed.ok) return parsed;

  try {
    const { token, user } = await authService.login(parsed.data);

    if (!PANEL_ROLES.includes(user.rol)) {
      return {
        ok: false,
        error:
          "Acceso denegado. Este portal es exclusivo para administradores y cocineros.",
      };
    }

    await createSession(token, user);
  } catch (error) {
    return toFailure(error);
  }

  const redirectTo = field(formData, "redirect") ?? "/dashboard";
  redirect(redirectTo);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
