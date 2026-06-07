import "server-only";
import { api } from "@/lib/api";
import type { Rol, Usuario } from "@/models";

/** SERVICE de usuarios. Habla con /api/users (CRUD protegido por JWT). */

export interface CreateUsuarioInput {
  correo: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

export type UpdateUsuarioInput = Partial<CreateUsuarioInput>;

export const usuarioService = {
  getAll: () => api.get<Usuario[]>("/users"),

  getById: (id: number) => api.get<Usuario>(`/users/${id}`),

  create: (data: CreateUsuarioInput) => api.post<Usuario>("/users", data),

  update: (id: number, data: UpdateUsuarioInput) =>
    api.put<Usuario>(`/users/${id}`, data),

  remove: (id: number) => api.delete<Usuario>(`/users/${id}`),
};
