/** Configuración centralizada del frontend de administración. */

/**
 * URL base del backend (TPI_Backend). Las llamadas se hacen del lado del
 * servidor (Server Components / Server Actions), por eso NO usa el prefijo
 * NEXT_PUBLIC_. El backend monta sus rutas bajo `/api`.
 */
export const API_URL = process.env.API_URL ?? "http://localhost:5000/api";

/** Nombre de la cookie httpOnly donde se guarda el JWT del backend. */
export const AUTH_COOKIE = "aroma_token";

/** Cookie (no httpOnly) con datos no sensibles del usuario para la UI. */
export const USER_COOKIE = "aroma_user";

/** Duración de la sesión en segundos (debe acompañar a JWT_EXPIRES_IN del backend). */
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24h
