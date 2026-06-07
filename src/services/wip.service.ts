import "server-only";
import { MOCK_ARTICULOS, MOCK_PEDIDOS_DELIVERY } from "./mock-data";

export const stockService = {
  getArticulos: async () => MOCK_ARTICULOS,
};

export const pedidoService = {
  getDelivery: async () => MOCK_PEDIDOS_DELIVERY,
  getCocina: async () => MOCK_PEDIDOS_DELIVERY,
};
