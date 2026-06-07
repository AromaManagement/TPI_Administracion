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

export const recetaService = {
  getIngredientes: async (platoId: number): Promise<PlatoArticuloRecord[]> => {
    const d = await load();
    return d.platoArticulos.filter((pa) => pa.platoId === platoId);
  },
};
