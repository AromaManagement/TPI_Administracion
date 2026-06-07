import "server-only";
import { api } from "@/lib/api";
import type { SessionUser } from "@/lib/session";

/**
 * SERVICE de autenticación. Habla con /api/auth del backend.
 * Devuelve el contrato crudo; la orquestación (set de cookie) la hace el controller.
 */

export interface AuthPayload {
  user: SessionUser;
  token: string;
}

export interface LoginInput {
  correo: string;
  contrasena: string;
}

export const authService = {
  login: (data: LoginInput) =>
    api.post<AuthPayload>("/auth/login", data, { skipAuth: true }),
};
