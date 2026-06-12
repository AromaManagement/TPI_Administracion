import "server-only";
import { api } from "@/lib/api";
import type { ArticuloStock, MovimientoStock, TipoMov, UnidadMedida } from "@/models";

// ---------------------------------------------------------------------------
// Backend response shapes
// ---------------------------------------------------------------------------

type BackendArticulo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  esIngrediente: boolean;
  unidadMedida: UnidadMedida | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type BackendStock = {
  id: number;
  articuloId: number;
  cantidad: number;
  minimo: number | null;
};

type BackendMovimiento = {
  id: number;
  stockId: number;
  tipoMov: TipoMov;
  cantidad: number;
  fecha: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// ---------------------------------------------------------------------------
// Public input types
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

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const stockService = {
  getArticulos: async (): Promise<ArticuloStock[]> => {
    const [articulos, stocks, movimientos] = await Promise.all([
      api.get<BackendArticulo[]>("/articulo"),
      api.get<BackendStock[]>("/stock"),
      api.get<BackendMovimiento[]>("/movimiento-stock"),
    ]);

    const stockMap = new Map(stocks.map((s) => [s.articuloId, s]));

    const movsByStock = new Map<number, MovimientoStock[]>();
    for (const m of movimientos) {
      const list = movsByStock.get(m.stockId) ?? [];
      list.push({
        id: m.id,
        stockId: m.stockId,
        tipoMov: m.tipoMov,
        cantidad: Number(m.cantidad),
        fecha: m.fecha.slice(0, 10),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        deletedAt: m.deletedAt,
      });
      movsByStock.set(m.stockId, list);
    }

    return articulos
      .filter((a) => !a.deletedAt)
      .map((a): ArticuloStock => {
        const s = stockMap.get(a.id);
        const movs = (movsByStock.get(s?.id ?? 0) ?? []).sort(
          (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
        );
        return {
          id: a.id,
          nombre: a.nombre,
          descripcion: a.descripcion,
          esIngrediente: a.esIngrediente,
          unidadMedida: a.unidadMedida,
          stockId: s?.id ?? 0,
          cantidad: s ? Number(s.cantidad) : 0,
          minimo: s?.minimo != null ? Number(s.minimo) : null,
          movimientos: movs,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          deletedAt: a.deletedAt,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  },

  createArticulo: async (input: CreateArticuloInput): Promise<ArticuloStock> => {
    // POST /articulo auto-creates a stock record (cantidad=0)
    const articulo = await api.post<BackendArticulo>("/articulo", {
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
      esIngrediente: input.esIngrediente,
      unidadMedida: input.unidadMedida || null,
    });

    // Fetch the stock record that was just created alongside the articulo
    const stocks = await api.get<BackendStock[]>("/stock");
    const stock = stocks.find((s) => s.articuloId === articulo.id)!;

    // Apply initial quantity as an INGRESO movement (also updates stock.cantidad)
    if (input.cantidadInicial > 0) {
      await api.post("/movimiento-stock", {
        stockId: stock.id,
        tipoMov: "INGRESO",
        cantidad: input.cantidadInicial,
        fecha: new Date().toISOString().slice(0, 10),
      });
    }

    // Set the minimum stock threshold if provided
    if (input.minimo !== null && input.minimo !== undefined) {
      await api.put(`/stock/${stock.id}`, { minimo: input.minimo });
    }

    return {
      id: articulo.id,
      nombre: articulo.nombre,
      descripcion: articulo.descripcion,
      esIngrediente: articulo.esIngrediente,
      unidadMedida: articulo.unidadMedida,
      stockId: stock.id,
      cantidad: input.cantidadInicial,
      minimo: input.minimo,
      movimientos: [],
      createdAt: articulo.createdAt,
      updatedAt: articulo.updatedAt,
      deletedAt: articulo.deletedAt,
    };
  },

  updateArticulo: async (id: number, input: UpdateArticuloInput): Promise<void> => {
    const [, stocks] = await Promise.all([
      api.put(`/articulo/${id}`, {
        nombre: input.nombre.trim(),
        descripcion: input.descripcion?.trim() || null,
        esIngrediente: input.esIngrediente,
        unidadMedida: input.unidadMedida || null,
      }),
      api.get<BackendStock[]>("/stock"),
    ]);

    const stock = stocks.find((s) => s.articuloId === id);
    if (stock) {
      await api.put(`/stock/${stock.id}`, { minimo: input.minimo ?? null });
    }
  },

  deleteArticulo: async (id: number): Promise<void> => {
    // Backend cascades the soft-delete to the associated stock record
    await api.delete(`/articulo/${id}`);
  },

  registrarMovimiento: async (articuloId: number, input: MovimientoInput): Promise<void> => {
    const stocks = await api.get<BackendStock[]>("/stock");
    const stock = stocks.find((s) => s.articuloId === articuloId);
    if (!stock) throw new Error(`No se encontró stock para el artículo ${articuloId}.`);

    await api.post("/movimiento-stock", {
      stockId: stock.id,
      tipoMov: input.tipoMov,
      cantidad: input.cantidad,
      fecha: input.fecha,
    });
  },
};
