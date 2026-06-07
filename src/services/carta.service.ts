import "server-only";
import fs from "fs/promises";
import path from "path";
import type { Carta, Seccion, Plato, Imagen } from "@/models";

// ---------------------------------------------------------------------------
// Shared local file store. Both TPI_Administracion and TPI_Carta read from the
// same JSON file so changes persist across hot reloads and are visible in the
// public menu viewer without a backend.
// To connect to the real backend, replace each method body with the
// corresponding fetch() call.
// ---------------------------------------------------------------------------

const DATA_PATH = path.resolve(process.cwd(), "..", "mock-data", "carta.json");

interface PersistedData {
  carta: Carta;
  nextIds: { seccion: number; plato: number; imagen: number };
}

const INITIAL_DATA: PersistedData = {
  carta: {
    id: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    secciones: [],
  },
  nextIds: { seccion: 100, plato: 100, imagen: 100 },
};

// Module-level cache — cleared on HMR, then re-read from disk.
let _cache: PersistedData | null = null;

async function load(): Promise<PersistedData> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    _cache = JSON.parse(raw) as PersistedData;
    return _cache;
  } catch {
    _cache = structuredClone(INITIAL_DATA);
    await persist(_cache);
    return _cache;
  }
}

async function persist(data: PersistedData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function ts() {
  return new Date().toISOString();
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function buildImagen(imagenSi: string, existing?: Imagen | null): Imagen {
  const data = _cache!;
  return {
    id: existing?.id ?? data.nextIds.imagen++,
    imagenSi,
    createdAt: existing?.createdAt ?? ts(),
    updatedAt: ts(),
    deletedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Input types (mirror what the backend DTOs will accept)
// ---------------------------------------------------------------------------

export interface CreateSeccionInput {
  nombre: string;
  detalle?: string | null;
}

export interface UpdateSeccionInput {
  nombre?: string;
  detalle?: string | null;
}

export interface CreatePlatoInput {
  seccionId: number;
  nombre: string;
  precio: number;
  detalle?: string | null;
  imagenSi?: string | null;
}

export interface UpdatePlatoInput {
  nombre?: string;
  precio?: number;
  detalle?: string | null;
  imagenSi?: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const cartaService = {
  getCarta: async (): Promise<Carta> => {
    const { carta } = await load();
    return clone(carta);
  },

  // --- Secciones ---

  createSeccion: async (data: CreateSeccionInput): Promise<Seccion> => {
    const d = await load();
    const seccion: Seccion = {
      id: d.nextIds.seccion++,
      cartaId: d.carta.id,
      nombre: data.nombre,
      detalle: data.detalle ?? null,
      platos: [],
      createdAt: ts(),
      updatedAt: ts(),
      deletedAt: null,
    };
    d.carta.secciones = [...(d.carta.secciones ?? []), seccion];
    d.carta.updatedAt = ts();
    await persist(d);
    return clone(seccion);
  },

  updateSeccion: async (id: number, data: UpdateSeccionInput): Promise<Seccion> => {
    const d = await load();
    const secciones = d.carta.secciones ?? [];
    const idx = secciones.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Sección no encontrada.");
    secciones[idx] = { ...secciones[idx], ...data, updatedAt: ts() };
    d.carta.updatedAt = ts();
    await persist(d);
    return clone(secciones[idx]);
  },

  deleteSeccion: async (id: number): Promise<void> => {
    const d = await load();
    const idx = (d.carta.secciones ?? []).findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Sección no encontrada.");
    d.carta.secciones!.splice(idx, 1);
    d.carta.updatedAt = ts();
    await persist(d);
  },

  // --- Platos ---

  createPlato: async (data: CreatePlatoInput): Promise<Plato> => {
    const d = await load();
    const seccion = (d.carta.secciones ?? []).find((s) => s.id === data.seccionId);
    if (!seccion) throw new Error("Sección no encontrada.");

    const imagen = data.imagenSi ? buildImagen(data.imagenSi) : null;
    const plato: Plato = {
      id: d.nextIds.plato++,
      seccionId: data.seccionId,
      nombre: data.nombre,
      precio: data.precio,
      detalle: data.detalle ?? null,
      imagenId: imagen?.id ?? null,
      imagen,
      createdAt: ts(),
      updatedAt: ts(),
      deletedAt: null,
    };
    seccion.platos = [...(seccion.platos ?? []), plato];
    d.carta.updatedAt = ts();
    await persist(d);
    return clone(plato);
  },

  updatePlato: async (id: number, data: UpdatePlatoInput): Promise<Plato> => {
    const d = await load();
    for (const seccion of d.carta.secciones ?? []) {
      const idx = (seccion.platos ?? []).findIndex((p) => p.id === id);
      if (idx === -1) continue;

      const existing = seccion.platos![idx];
      let imagen = existing.imagen ?? null;

      if (data.imagenSi !== undefined) {
        imagen = data.imagenSi ? buildImagen(data.imagenSi, imagen) : null;
      }

      seccion.platos![idx] = {
        ...existing,
        nombre: data.nombre ?? existing.nombre,
        precio: data.precio ?? existing.precio,
        detalle: "detalle" in data ? (data.detalle ?? null) : existing.detalle,
        imagenId: imagen?.id ?? null,
        imagen,
        updatedAt: ts(),
      };
      d.carta.updatedAt = ts();
      await persist(d);
      return clone(seccion.platos![idx]);
    }
    throw new Error("Plato no encontrado.");
  },

  deletePlato: async (id: number): Promise<void> => {
    const d = await load();
    for (const seccion of d.carta.secciones ?? []) {
      const idx = (seccion.platos ?? []).findIndex((p) => p.id === id);
      if (idx !== -1) {
        seccion.platos!.splice(idx, 1);
        d.carta.updatedAt = ts();
        await persist(d);
        return;
      }
    }
    throw new Error("Plato no encontrado.");
  },
};
