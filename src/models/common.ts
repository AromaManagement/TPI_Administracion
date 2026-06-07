/**
 * Tipos comunes compartidos por toda la capa de modelos.
 *
 * El backend (TPI_Backend, Express + Prisma) responde siempre con la forma
 * { status, message, data }. Estos tipos reflejan ese contrato.
 */

export type ApiStatus = "success" | "error";

/** Sobre estándar de respuesta del backend. */
export interface ApiResponse<T> {
  status: ApiStatus;
  message: string;
  data: T;
}

/** Campos de auditoría presentes en (casi) todos los modelos del schema Prisma. */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Resultado uniforme que devuelven los controllers (server actions) a las vistas. */
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
