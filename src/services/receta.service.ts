import "server-only";
import fs from "fs/promises";
import path from "path";

const DATA_PATH = path.resolve(process.cwd(), "..", "mock-data", "recetas.json");

interface PlatoArticuloRecord {
  platoId: number;
  articuloId: number;
  cantidad: number;
}

interface RecetasData {
  platoArticulos: PlatoArticuloRecord[];
}

let _cache: RecetasData | null = null;

async function load(): Promise<RecetasData> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    _cache = JSON.parse(raw) as RecetasData;
    return _cache;
  } catch {
    _cache = { platoArticulos: [] };
    return _cache;
  }
}

async function save(data: RecetasData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export const recetaService = {
  getIngredientes: async (platoId: number): Promise<PlatoArticuloRecord[]> => {
    const d = await load();
    return d.platoArticulos.filter((pa) => pa.platoId === platoId);
  },

  getAllPlatoArticulos: async (): Promise<PlatoArticuloRecord[]> => {
    const d = await load();
    return d.platoArticulos;
  },

  /** Replaces all ingredients for a plato. Pass empty array to remove all. */
  setReceta: async (
    platoId: number,
    ingredientes: { articuloId: number; cantidad: number }[],
  ): Promise<void> => {
    const d = await load();
    d.platoArticulos = d.platoArticulos.filter((pa) => pa.platoId !== platoId);
    for (const ing of ingredientes) {
      if (ing.cantidad > 0) {
        d.platoArticulos.push({ platoId, articuloId: ing.articuloId, cantidad: ing.cantidad });
      }
    }
    await save(d);
  },

  deleteReceta: async (platoId: number): Promise<void> => {
    const d = await load();
    d.platoArticulos = d.platoArticulos.filter((pa) => pa.platoId !== platoId);
    await save(d);
  },
};
