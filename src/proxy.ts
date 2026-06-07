import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, USER_COOKIE } from "@/lib/config";
import type { Rol } from "@/models";

/** Rutas públicas (no requieren sesión). */
const PUBLIC_PATHS = ["/login"];

/** Roles con acceso al panel de administración. */
const PANEL_ROLES: Rol[] = ["ADMIN", "COCINERO"];

/** Parsea el USER_COOKIE y valida que tenga el shape post-refactor. */
function parseUserCookie(raw: string | undefined): { rol?: Rol; nombre?: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Validar campos mínimos del shape actual
    if (
      typeof parsed.nombre !== "string" ||
      typeof parsed.apellido !== "string" ||
      typeof parsed.correo !== "string"
    ) {
      return null;
    }
    return parsed as { rol?: Rol; nombre?: string };
  } catch {
    return null;
  }
}

/** Respuesta de redirect que limpia ambas cookies de sesión. */
function redirectAndClear(url: URL): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.delete(AUTH_COOKIE);
  response.cookies.delete(USER_COOKIE);
  return response;
}

/**
 * Proxy de autenticación y autorización por rol.
 *
 * - Sin sesión → redirige a /login.
 * - Cookie malformado (formato anterior al refactor) → limpia cookies y redirige a /login.
 * - Con sesión pero rol CLIENTE o REPARTIDOR → limpia cookies y redirige a /login.
 * - Con sesión y rol ADMIN → deja pasar.
 * - Con sesión y rol COCINERO → solo puede acceder a /cocina; cualquier otra ruta redirige a /cocina.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = Boolean(req.cookies.get(AUTH_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!isAuthenticated && !isPublic) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && !isPublic) {
    const raw = req.cookies.get(USER_COOKIE)?.value;
    const user = parseUserCookie(raw);

    // Cookie ausente o malformado → limpiar y forzar re-login
    if (!user) {
      return redirectAndClear(new URL("/login", req.url));
    }

    // Rol sin acceso al panel → limpiar y redirigir
    if (user.rol && !PANEL_ROLES.includes(user.rol)) {
      return redirectAndClear(new URL("/login", req.url));
    }

    // Cocinero solo puede acceder a /cocina
    if (user.rol === "COCINERO" && pathname !== "/cocina") {
      return NextResponse.redirect(new URL("/cocina", req.url));
    }
  }

  // Usuario autenticado intentando acceder a /login → redirigir al panel
  if (isAuthenticated && isPublic) {
    const user = parseUserCookie(req.cookies.get(USER_COOKIE)?.value);
    const home = user?.rol === "COCINERO" ? "/cocina" : "/dashboard";
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
