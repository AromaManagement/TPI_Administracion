import "server-only";
import { api } from "@/lib/api";
import type { CocinaComanda, CocinaDetalle, EstadoComanda } from "@/models";

// ---------------------------------------------------------------------------
// Shape del backend
//
// LIMITACIÓN: `detalles: true` en el select del backend devuelve los campos
// de DetalleComanda (platoId, empleadoId, precioUnitario) pero sin joins a
// Platos ni Usuario — los nombres de plato y empleado no están disponibles
// hasta que el backend agregue esos joins al select.
// ---------------------------------------------------------------------------

interface BackendDetalle {
  id: number;
  comandaId: number;
  platoId: number;
  empleadoId: number | null;
  precioUnitario: string | number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface BackendDireccion {
  barrio: string | null;
  calle: string | null;
  numeracion: string | null;
  referencia: string | null;
}

interface BackendComanda {
  id: number;
  clienteId: number | null;
  estadoComanda: string | null;
  fechaSolicitud: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  repartidorId: number | null;
  cliente: { id: number; nombre: string; apellido: string } | null;
  detalles: BackendDetalle[];
  repartidor: { id: number; nombre: string; apellido: string } | null;
  direccion: BackendDireccion | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function formatDireccion(d: BackendDireccion | null): string | null {
  if (!d) return null;
  return [d.calle, d.numeracion, d.barrio].filter(Boolean).join(", ") || null;
}

function toDetalle(d: BackendDetalle): CocinaDetalle {
  return {
    id: d.id,
    platoId: d.platoId,
    // El backend no incluye plato.nombre en el select actual
    platoNombre: `Plato #${d.platoId}`,
    empleadoId: d.empleadoId,
    // El backend no incluye empleado.nombre en el select actual
    empleadoNombre: null,
    precioUnitario: Number(d.precioUnitario),
  };
}

function toComanda(bc: BackendComanda): CocinaComanda {
  return {
    id: bc.id,
    clienteNombre: bc.cliente
      ? `${bc.cliente.nombre} ${bc.cliente.apellido}`
      : null,
    estadoComanda: (bc.estadoComanda ?? "SIN_ASIGNAR") as EstadoComanda,
    fechaSolicitud: bc.fechaSolicitud,
    createdAt: bc.createdAt,
    updatedAt: bc.updatedAt,
    deletedAt: bc.deletedAt,
    repartidorId: bc.repartidorId ?? null,
    direccion: formatDireccion(bc.direccion),
    detalles: bc.detalles
      .filter((d) => !d.deletedAt)
      .map(toDetalle),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

async function fetchPorEstado(estado: EstadoComanda): Promise<BackendComanda[]> {
  return api.get<BackendComanda[]>(`/comandas/estado/${estado}`);
}

const ESTADOS_COCINA: EstadoComanda[] = ["SIN_ASIGNAR", "EN_COCINA", "LISTO"];

export const cocinaService = {
  getCocina: async (): Promise<CocinaComanda[]> => {
    const results = await Promise.all(ESTADOS_COCINA.map(fetchPorEstado));
    return results
      .flat()
      .sort(
        (a, b) =>
          new Date(a.fechaSolicitud).getTime() -
          new Date(b.fechaSolicitud).getTime(),
      )
      .map(toComanda);
  },

  tomarComanda: async (comandaId: number): Promise<void> => {
    await api.patch(`/comandas/${comandaId}/estado`, { nuevoEstado: "EN_COCINA" });
  },

  completarComanda: async (comandaId: number): Promise<void> => {
    await api.patch(`/comandas/${comandaId}/estado`, { nuevoEstado: "LISTO" });
  },
};
