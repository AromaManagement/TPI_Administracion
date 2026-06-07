import "server-only";
import type { Articulo, Comanda } from "@/models";

/**
 * Datos MOCK para los módulos cuyo backend todavía es Work In Progress.
 *
 * Cuando TPI_Backend exponga los endpoints correspondientes, reemplazar estos
 * datasets por llamadas reales en los services de cada dominio. La forma de los
 * datos ya respeta los tipos de la capa de modelos.
 */

export const MOCK_ARTICULOS: Articulo[] = [
  {
    id: 1,
    nombre: "Gaseosa Cola 1L",
    descripcion: "Botella individual",
    esIngrediente: false,
    unidadMedida: "UNIDAD",
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
    stock: {
      id: 1,
      articuloId: 1,
      cantidad: 48,
      minimo: 12,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
    },
  },
  {
    id: 2,
    nombre: "Papa",
    descripcion: "Ingrediente para guarniciones",
    esIngrediente: true,
    unidadMedida: "KG",
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
    stock: {
      id: 2,
      articuloId: 2,
      cantidad: 8,
      minimo: 10,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
    },
  },
];

export const MOCK_PEDIDOS_DELIVERY: Comanda[] = [
  {
    id: 101,
    empleadoId: null,
    clienteId: 5,
    estadoComanda: "EN_COCINA",
    fechaSolicitud: "2026-06-06T12:30:00.000Z",
    fechaEntrega: null,
    createdAt: "2026-06-06T12:30:00.000Z",
    updatedAt: "2026-06-06T12:30:00.000Z",
    deletedAt: null,
    cliente: {
      id: 5,
      usuarioId: 5,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      usuario: {
        id: 5,
        correo: "lucia@example.com",
        nombre: "Lucía",
        apellido: "Fernández",
        tipoDocumento: null,
        documento: null,
        nacimiento: null,
        direccionId: null,
        rol: "CLIENTE",
        createdAt: "",
        updatedAt: "",
        deletedAt: null,
      },
    },
    comandaAplicacion: {
      id: 1,
      comandaId: 101,
      direccionId: 1,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
      direccion: {
        id: 1,
        barrio: "Centro",
        calle: "San Martín",
        manzanaPiso: null,
        numeracion: "1234",
        referencia: "Timbre 2",
        casaDepto: "3B",
        localidadId: 1,
        createdAt: "",
        updatedAt: "",
        deletedAt: null,
      },
    },
  },
];
