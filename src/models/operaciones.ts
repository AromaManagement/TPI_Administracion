/**
 * Tipos para módulos que todavía NO existen en el schema Prisma del backend.
 */

import type { Timestamps } from "./common";

/** Reseña de servicio (app de delivery). */
export interface Resena extends Partial<Timestamps> {
  id: number;
  comandaId: number | null;
  puntaje: number;
  comentario: string | null;
  fecha: string;
}
