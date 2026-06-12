import "server-only";
import { api } from "@/lib/api";
import type { Carta, Seccion, Plato } from "@/models";

export interface CreateSeccionInput {
  nombre: string;
  detalle?: string | null;
}

export interface UpdateSeccionInput {
  nombre?: string;
  detalle?: string | null;
}

export interface IngredienteInput {
  articuloId: number;
  cantidad: number;
}

export interface CreatePlatoInput {
  seccionId: number;
  nombre: string;
  precio: number;
  detalle?: string | null;
  imagenSi?: string | null;
  ingredientes?: IngredienteInput[];
}

export interface UpdatePlatoInput {
  nombre?: string;
  precio?: number;
  detalle?: string | null;
  imagenSi?: string | null;
  ingredientes?: IngredienteInput[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Crea o actualiza una imagen y devuelve su ID. Devuelve null si no hay imagen. */
async function upsertImagen(imagenSi: string | null | undefined, existingId?: number | null): Promise<number | null> {
  if (!imagenSi) return null;
  if (existingId) {
    const updated = await api.put<{ id: number }>(`/imagenes/${existingId}`, { imagenSi });
    return updated.id;
  }
  const created = await api.post<{ id: number }>("/imagenes", { imagenSi });
  return created.id;
}

/** Obtiene el ID de la carta activa (o crea una si no existe). */
async function getCartaId(): Promise<number> {
  const carta = await api.get<Carta>("/carta/admin");
  return carta.id;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const cartaService = {
  getCarta: async (): Promise<Carta> => {
    return await api.get<Carta>("/carta/admin");
  },

  // --- Secciones ---

  createSeccion: async (data: CreateSeccionInput): Promise<Seccion> => {
    const cartaId = await getCartaId();
    return await api.post<Seccion>("/secciones", {
      nombre: data.nombre,
      cartaId,
      detalle: data.detalle ?? null,
    });
  },

  updateSeccion: async (id: number, data: UpdateSeccionInput): Promise<Seccion> => {
    return await api.put<Seccion>(`/secciones/${id}`, {
      nombre: data.nombre,
      detalle: data.detalle ?? null,
    });
  },

  deleteSeccion: async (id: number): Promise<void> => {
    await api.delete(`/secciones/${id}`);
  },

  // --- Platos ---

  createPlato: async (data: CreatePlatoInput): Promise<Plato> => {
    const imagenId = await upsertImagen(data.imagenSi);
    return await api.post<Plato>("/platos", {
      seccionId: data.seccionId,
      nombre: data.nombre,
      precio: data.precio,
      detalle: data.detalle ?? null,
      imagenId,
      articulos: (data.ingredientes ?? []).map((i) => ({
        articuloId: i.articuloId,
        cantidad: i.cantidad,
      })),
    });
  },

  updatePlato: async (id: number, data: UpdatePlatoInput): Promise<Plato> => {
    // Sólo busca la imagen actual si necesitamos actualizarla
    let imagenId: number | null | undefined = undefined;
    if ("imagenSi" in data) {
      const carta = await api.get<Carta>("/carta/admin");
      const existing = carta.secciones
        ?.flatMap((s) => s.platos ?? [])
        .find((p) => p.id === id);
      imagenId = await upsertImagen(data.imagenSi, existing?.imagenId ?? undefined);
    }

    const body: Record<string, unknown> = {};
    if (data.nombre !== undefined) body.nombre = data.nombre;
    if (data.precio !== undefined) body.precio = data.precio;
    if (data.detalle !== undefined) body.detalle = data.detalle;
    if (imagenId !== undefined) body.imagenId = imagenId;
    if (data.ingredientes !== undefined) {
      body.articulos = data.ingredientes.map((i) => ({
        articuloId: i.articuloId,
        cantidad: i.cantidad,
      }));
    }

    return await api.put<Plato>(`/platos/${id}`, body);
  },

  deletePlato: async (id: number): Promise<void> => {
    await api.delete(`/platos/${id}`);
  },
};
