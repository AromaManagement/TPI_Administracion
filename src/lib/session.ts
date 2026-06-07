import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE, USER_COOKIE, SESSION_MAX_AGE } from "./config";
import type { Rol, Usuario } from "@/models";

export type SessionUser = Pick<
  Usuario,
  "id" | "correo" | "nombre" | "apellido" | "rol"
>;

/** Persiste el JWT y los datos del usuario tras un login exitoso. */
export async function createSession(token: string, user: SessionUser) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";

  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  store.set(USER_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Cierra la sesión eliminando ambas cookies. */
export async function destroySession() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  store.delete(USER_COOKIE);
}

/** Devuelve el usuario actual (desde la cookie) o null si no hay sesión o el cookie está malformado. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  if (!store.get(AUTH_COOKIE)?.value) return null;

  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed.id || !parsed.correo || !parsed.nombre || !parsed.apellido || !parsed.rol) {
      return null;
    }
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

/** Indica si hay una sesión activa. */
export async function isAuthenticated(): Promise<boolean> {
  return Boolean((await cookies()).get(AUTH_COOKIE)?.value);
}

// Re-export Rol para que los layouts no tengan que importar desde models
export type { Rol };
