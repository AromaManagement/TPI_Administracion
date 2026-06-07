import "server-only";
import { api } from "@/lib/api";
import type { Localidad } from "@/models";

/** SERVICE de localidades. Habla con /api/localidades (CRUD protegido por JWT). */

export interface CreateLocalidadInput {
  nombre: string;
}

export type UpdateLocalidadInput = Partial<CreateLocalidadInput>;

export const localidadService = {
  getAll: () => api.get<Localidad[]>("/localidades"),

  getById: (id: number) => api.get<Localidad>(`/localidades/${id}`),

  create: (data: CreateLocalidadInput) =>
    api.post<Localidad>("/localidades", data),

  update: (id: number, data: UpdateLocalidadInput) =>
    api.put<Localidad>(`/localidades/${id}`, data),

  remove: (id: number) => api.delete<Localidad>(`/localidades/${id}`),
};
