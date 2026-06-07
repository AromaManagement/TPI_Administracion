"use client";

import { useState, useTransition } from "react";
import { MapPin, TruckIcon, CheckCircleIcon, XCircleIcon, PackageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PedidoDelivery, EstadoRecorrido } from "@/models";
import { formatDateTime } from "@/lib/format";
import {
  despacharPedido,
  confirmarEntrega,
  cancelarRecorrido,
} from "@/controllers/pedidos.controller";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ColumnaEstado = "pendiente" | "en_camino" | "finalizado";

function getColumna(p: PedidoDelivery): ColumnaEstado {
  if (!p.recorrido || p.recorrido.estado === "PENDIENTE") return "pendiente";
  if (p.recorrido.estado === "EN_CAMINO") return "en_camino";
  return "finalizado";
}

const ESTADO_BADGE: Record<EstadoRecorrido, string> = {
  PENDIENTE:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  EN_CAMINO:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ENTREGADO:  "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  CANCELADO:  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const ESTADO_LABEL: Record<EstadoRecorrido, string> = {
  PENDIENTE: "Pendiente",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

function formatPeso(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

// ---------------------------------------------------------------------------
// PedidoCard
// ---------------------------------------------------------------------------

function PedidoCard({
  pedido,
  onDespachar,
  onConfirmar,
  onCancelar,
  pending,
}: {
  pedido: PedidoDelivery;
  onDespachar: (id: number) => void;
  onConfirmar: (id: number) => void;
  onCancelar: (id: number) => void;
  pending: boolean;
}) {
  const columna = getColumna(pedido);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span>Pedido #{pedido.comandaId}</span>
          {pedido.recorrido ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[pedido.recorrido.estado]}`}
            >
              {ESTADO_LABEL[pedido.recorrido.estado]}
            </span>
          ) : (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
              Listo para despacho
            </span>
          )}
        </CardTitle>
        <p className="text-muted-foreground text-xs" suppressHydrationWarning>
          {pedido.clienteNombre} · {formatDateTime(pedido.fechaSolicitud)}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pt-0 flex-1">
        <p className="text-muted-foreground flex items-start gap-1 text-xs">
          <MapPin className="mt-0.5 size-3 shrink-0" />
          <span>{pedido.direccion}</span>
        </p>

        <ul className="flex flex-col gap-0.5 border-t pt-2">
          {pedido.detalles.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-foreground">{d.platoNombre}</span>
              <span className="text-muted-foreground shrink-0">{formatPeso(d.precioUnitario)}</span>
            </li>
          ))}
        </ul>

        <p className="flex justify-between border-t pt-1 text-xs font-semibold">
          <span>Total</span>
          <span>{formatPeso(pedido.total)}</span>
        </p>
      </CardContent>

      {columna !== "finalizado" && (
        <CardFooter className="flex gap-2 pt-0">
          {columna === "pendiente" && (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              disabled={pending}
              onClick={() => onDespachar(pedido.comandaAplicacionId)}
            >
              <TruckIcon className="size-3.5" />
              Despachar
            </Button>
          )}
          {columna === "en_camino" && (
            <>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                disabled={pending}
                onClick={() => onConfirmar(pedido.recorrido!.id)}
              >
                <CheckCircleIcon className="size-3.5" />
                Entregado
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() => onCancelar(pedido.recorrido!.id)}
              >
                <XCircleIcon className="size-3.5" />
                Cancelar
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PedidosView
// ---------------------------------------------------------------------------

const COLUMNAS: { key: ColumnaEstado; label: string; color: string; icon: React.ElementType }[] = [
  { key: "pendiente",  label: "Listos para despacho", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400", icon: PackageIcon },
  { key: "en_camino",  label: "En camino",            color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",         icon: TruckIcon },
  { key: "finalizado", label: "Finalizados",          color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",      icon: CheckCircleIcon },
];

export function PedidosView({ initial }: { initial: PedidoDelivery[] }) {
  const [pedidos, setPedidos] = useState<PedidoDelivery[]>(initial);
  const [isPending, startTransition] = useTransition();

  function handleDespachar(comandaAplicacionId: number) {
    const tempId = Date.now();
    const fechaIn = new Date().toISOString().slice(0, 10);
    setPedidos((prev) =>
      prev.map((p) =>
        p.comandaAplicacionId === comandaAplicacionId
          ? { ...p, recorrido: { id: tempId, estado: "EN_CAMINO", fechaIn, fechaFin: null } }
          : p
      )
    );
    startTransition(async () => {
      const real = await despacharPedido(comandaAplicacionId);
      setPedidos((prev) =>
        prev.map((p) =>
          p.recorrido?.id === tempId ? { ...p, recorrido: real } : p
        )
      );
    });
  }

  function handleConfirmar(recorridoId: number) {
    const today = new Date().toISOString().slice(0, 10);
    setPedidos((prev) =>
      prev.map((p) =>
        p.recorrido?.id === recorridoId
          ? { ...p, recorrido: { ...p.recorrido!, estado: "ENTREGADO", fechaFin: today } }
          : p
      )
    );
    startTransition(async () => { await confirmarEntrega(recorridoId); });
  }

  function handleCancelar(recorridoId: number) {
    setPedidos((prev) =>
      prev.map((p) =>
        p.recorrido?.id === recorridoId
          ? { ...p, recorrido: { ...p.recorrido!, estado: "CANCELADO" } }
          : p
      )
    );
    startTransition(async () => { await cancelarRecorrido(recorridoId); });
  }

  if (pedidos.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed px-6 py-16 text-center text-sm">
        No hay pedidos delivery listos. Cuando una comanda de la app esté lista en cocina, aparecerá aquí.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNAS.map(({ key, label, color, icon: Icon }) => {
        const col = pedidos.filter((p) => getColumna(p) === key);
        return (
          <section key={key} className="flex flex-col gap-3">
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color}`}>
              <div className="flex items-center gap-1.5">
                <Icon className="size-4" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              <Badge variant="outline" className="border-current text-current text-xs">
                {col.length}
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              {col.length === 0 ? (
                <p className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-sm">
                  Sin pedidos
                </p>
              ) : (
                col.map((p) => (
                  <PedidoCard
                    key={p.comandaId}
                    pedido={p}
                    onDespachar={handleDespachar}
                    onConfirmar={handleConfirmar}
                    onCancelar={handleCancelar}
                    pending={isPending}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
