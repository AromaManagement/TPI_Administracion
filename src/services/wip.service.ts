import "server-only";
import { MOCK_CARTA, MOCK_ARTICULOS, MOCK_PEDIDOS_DELIVERY } from "./mock-data";

export const cartaService = {
  getActiva: async () => MOCK_CARTA,
};

export const stockService = {
  getArticulos: async () => MOCK_ARTICULOS,
};

export const pedidoService = {
  getDelivery: async () => MOCK_PEDIDOS_DELIVERY,
  getCocina: async () => MOCK_PEDIDOS_DELIVERY,
};
