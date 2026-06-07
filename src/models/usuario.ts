import type { Timestamps } from "./common";

/** Enum de roles del sistema (refleja el enum Prisma del backend). */
export type Rol = "ADMIN" | "CLIENTE" | "COCINERO" | "REPARTIDOR";

/** Etiquetas legibles para mostrar en la UI. */
export const ROLES: Record<Rol, string> = {
  ADMIN: "Administrador",
  COCINERO: "Cocinero",
  CLIENTE: "Cliente",
  REPARTIDOR: "Repartidor",
};

/** Roles que tienen acceso al panel de administración. */
export const PANEL_ROLES: Rol[] = ["ADMIN", "COCINERO"];

/**
 * Modelo `usuario` del schema Prisma.
 * Los datos personales (nombre, apellido, etc.) ya están unificados en usuario.
 * El backend nunca devuelve `contrasena`.
 */
export interface Usuario extends Timestamps {
  id: number;
  correo: string;
  nombre: string;
  apellido: string;
  tipoDocumento: string | null;
  documento: string | null;
  nacimiento: string | null;
  direccionId: number | null;
  rol: Rol;
}
