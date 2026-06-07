import "server-only";
import fs from "fs/promises";
import path from "path";
import type { Articulo, Stock, MovimientoStock, ArticuloStock, TipoMov, UnidadMedida } from "@/models";

// ---------------------------------------------------------------------------
// File store — replace each method body with fetch() to connect the backend.
// ---------------------------------------------------------------------------

const DATA_PATH = path.resolve(process.cwd(), "..", "mock-data", "stock.json");

interface PersistedData {
  articulos: Articulo[];
  stocks: Stock[];
  movimientos: MovimientoStock[];
  nextIds: { articulo: number; stock: number; movimiento: number };
}

let _cache: PersistedData | null = null;

async function load(): Promise<PersistedData> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    _cache = JSON.parse(raw) as PersistedData;
    return _cache;
  } catch {
    _cache = { articulos: [], stocks: [], movimientos: [], nextIds: { articulo: 1, stock: 1, movimiento: 1 } };
    await save(_cache);
    return _cache;
  }
}

async function save(data: PersistedData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function ts() {
  return new Date().toISOString();
}

function buildView(d: PersistedData): ArticuloStock[] {
  return d.articulos
    .filter((a) => !a.deletedAt)
    .map((a) => {
      const stock = d.stocks.find((s) => s.articuloId === a.id && !s.deletedAt);
      const movimientos = d.movimientos
        .filter((m) => m.stockId === stock?.id && !m.deletedAt)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
      return {
        id: a.id,
        nombre: a.nombre,
        descripcion: a.descripcion,
        esIngrediente: a.esIngrediente,
        unidadMedida: a.unidadMedida,
        stockId: stock?.id ?? 0,
        cantidad: stock?.cantidad ?? 0,
        minimo: stock?.minimo ?? null,
        movimientos,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        deletedAt: a.deletedAt,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type CreateArticuloInput = {
  nombre: string;
  descripcion: string | null;
  esIngrediente: boolean;
  unidadMedida: UnidadMedida | null;
  cantidadInicial: number;
  minimo: number | null;
};

export type UpdateArticuloInput = {
  nombre: string;
  descripcion: string | null;
  esIngrediente: boolean;
  unidadMedida: UnidadMedida | null;
  minimo: number | null;
};

export type MovimientoInput = {
  tipoMov: TipoMov;
  cantidad: number;
  fecha: string;
};

export const stockService = {
  getArticulos: async (): Promise<ArticuloStock[]> => {
    const d = await load();
    return buildView(d);
  },

  createArticulo: async (input: CreateArticuloInput): Promise<ArticuloStock> => {
    const d = await load();

    const articuloId = d.nextIds.articulo++;
    const stockId = d.nextIds.stock++;
    const movimientoId = d.nextIds.movimiento++;
    const now = ts();

    d.articulos.push({
      id: articuloId,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
      esIngrediente: input.esIngrediente,
      unidadMedida: input.unidadMedida,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    d.stocks.push({
      id: stockId,
      articuloId,
      cantidad: input.cantidadInicial,
      minimo: input.minimo,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const movimientos: MovimientoStock[] = [];
    if (input.cantidadInicial > 0) {
      const mov: MovimientoStock = {
        id: movimientoId,
        stockId,
        tipoMov: "INGRESO",
        cantidad: input.cantidadInicial,
        fecha: now.slice(0, 10),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      d.movimientos.push(mov);
      movimientos.push(mov);
    }

    await save(d);

    return {
      id: articuloId,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
      esIngrediente: input.esIngrediente,
      unidadMedida: input.unidadMedida,
      stockId,
      cantidad: input.cantidadInicial,
      minimo: input.minimo,
      movimientos,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  },

  updateArticulo: async (id: number, input: UpdateArticuloInput): Promise<void> => {
    const d = await load();
    const articulo = d.articulos.find((a) => a.id === id);
    if (!articulo) throw new Error(`Artículo ${id} no encontrado.`);

    articulo.nombre = input.nombre.trim();
    articulo.descripcion = input.descripcion?.trim() || null;
    articulo.esIngrediente = input.esIngrediente;
    articulo.unidadMedida = input.unidadMedida;
    articulo.updatedAt = ts();

    const stock = d.stocks.find((s) => s.articuloId === id);
    if (stock) {
      stock.minimo = input.minimo;
      stock.updatedAt = ts();
    }

    await save(d);
  },

  deleteArticulo: async (id: number): Promise<void> => {
    const d = await load();
    const articulo = d.articulos.find((a) => a.id === id);
    if (!articulo) throw new Error(`Artículo ${id} no encontrado.`);

    const now = ts();
    articulo.deletedAt = now;
    articulo.updatedAt = now;

    const stock = d.stocks.find((s) => s.articuloId === id);
    if (stock) {
      stock.deletedAt = now;
      stock.updatedAt = now;
    }

    await save(d);
  },

  registrarMovimiento: async (articuloId: number, input: MovimientoInput): Promise<void> => {
    const d = await load();
    const stock = d.stocks.find((s) => s.articuloId === articuloId && !s.deletedAt);
    if (!stock) throw new Error(`Stock para artículo ${articuloId} no encontrado.`);

    const now = ts();
    const movimientoId = d.nextIds.movimiento++;

    d.movimientos.push({
      id: movimientoId,
      stockId: stock.id,
      tipoMov: input.tipoMov,
      cantidad: input.cantidad,
      fecha: input.fecha,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // Actualizar la cantidad actual del stock
    switch (input.tipoMov) {
      case "INGRESO":
        stock.cantidad += input.cantidad;
        break;
      case "EGRESO":
      case "MERMA":
        stock.cantidad = Math.max(0, stock.cantidad - input.cantidad);
        break;
      case "AJUSTE":
        stock.cantidad = input.cantidad;
        break;
    }
    stock.updatedAt = now;

    await save(d);
  },
};
