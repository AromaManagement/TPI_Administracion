import "server-only";
import { api } from "@/lib/api";
import type { Rol, Usuario } from "@/models";

export interface CreateUsuarioInput {
  correo: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

export type UpdateUsuarioInput = Partial<CreateUsuarioInput>;

export const usuarioService = {
  getAll: () => api.get<Usuario[]>("/usuarios"),

  getById: (id: number) => api.get<Usuario>(`/usuarios/${id}`),

  create: (data: CreateUsuarioInput) => api.post<Usuario>("/usuarios", data),

  update: (id: number, data: UpdateUsuarioInput) =>
    api.put<Usuario>(`/usuarios/${id}`, data),

  remove: (id: number) => api.delete<Usuario>(`/usuarios/${id}`),

  getByRol: (rol: string) =>
    api.get<Pick<Usuario, "id" | "nombre" | "apellido">[]>(`/usuarios/by-rol?rol=${rol}`),
};
