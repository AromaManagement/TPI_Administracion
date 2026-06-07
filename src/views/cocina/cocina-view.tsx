"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, PlayIcon } from "lucide-react";
import type { CocinaComanda, CocinaDetalle, EstadoComanda } from "@/models";
import { formatDateTime } from "@/lib/format";
import {
  asignarDetalle,
  completarDetalle,
  desasignarDetalle,
  simularPedido,
} from "@/controllers/cocina.controller";

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

const COLUMNS: { estado: EstadoComanda; label: string; color: string }[] = [
  { estado: "SIN_ASIGNAR", label: "Sin asignar", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400" },
  { estado: "EN_COCINA",   label: "En cocina",   color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" },
  { estado: "LISTO",       label: "Listo",        color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" },
];

const DETALLE_BADGE: Record<string, string> = {
  SIN_ASIGNAR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  EN_PROCESO:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  LISTO:       "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const DETALLE_LABEL: Record<string, string> = {
  SIN_ASIGNAR: "Sin asignar",
  EN_PROCESO:  "En proceso",
  LISTO:       "Listo",
};

// ---------------------------------------------------------------------------
// ConfirmListoDialog
// ---------------------------------------------------------------------------

function ConfirmListoDialog({
  platoNombre,
  open,
  onConfirm,
  onCancel,
}: {
  platoNombre: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Marcar como listo?</DialogTitle>
          <DialogDescription>
            Estás por marcar <strong>{platoNombre}</strong> como listo.
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// DetalleRow
// ---------------------------------------------------------------------------

function DetalleRow({
  detalle,
  onAsignar,
  onDesasignar,
  onRequestCompletar,
  pending,
}: {
  detalle: CocinaDetalle;
  onAsignar: (id: number) => void;
  onDesasignar: (id: number) => void;
  onRequestCompletar: (id: number, nombre: string) => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{detalle.platoNombre}</p>
        {detalle.empleadoNombre && (
          <p className="text-muted-foreground text-xs mt-0.5">{detalle.empleadoNombre}</p>
        )}
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DETALLE_BADGE[detalle.estado]}`}
        >
          {DETALLE_LABEL[detalle.estado]}
        </span>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {detalle.estado === "SIN_ASIGNAR" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={pending}
            onClick={() => onAsignar(detalle.id)}
          >
            Asignarme
          </Button>
        )}
        {detalle.estado === "EN_PROCESO" && (
          <>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={pending}
              onClick={() => onRequestCompletar(detalle.id, detalle.platoNombre)}
            >
              Listo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              disabled={pending}
              onClick={() => onDesasignar(detalle.id)}
            >
              Desasignar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComandaCard
// ---------------------------------------------------------------------------

function ComandaCard({
  comanda,
  onAsignar,
  onDesasignar,
  onRequestCompletar,
  pending,
}: {
  comanda: CocinaComanda;
  onAsignar: (id: number) => void;
  onDesasignar: (id: number) => void;
  onRequestCompletar: (id: number, nombre: string) => void;
  pending: boolean;
}) {
  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span>Comanda #{comanda.id}</span>
          <span className="text-muted-foreground font-normal text-xs" suppressHydrationWarning>
            {formatDateTime(comanda.fechaSolicitud)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {comanda.direccion && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3 shrink-0" />
            <span>{comanda.direccion}</span>
          </p>
        )}
        {comanda.detalles.map((det) => (
          <DetalleRow
            key={det.id}
            detalle={det}
            onAsignar={onAsignar}
            onDesasignar={onDesasignar}
            onRequestCompletar={onRequestCompletar}
            pending={pending}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CocinaView
// ---------------------------------------------------------------------------

type PendingConfirm = { detalleId: number; platoNombre: string } | null;

export function CocinaView({ initial }: { initial: CocinaComanda[] }) {
  const [comandas, setComandas] = useState<CocinaComanda[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  function deriveEstado(detalles: CocinaDetalle[]): EstadoComanda {
    if (detalles.length === 0) return "SIN_ASIGNAR";
    if (detalles.every((d) => d.estado === "LISTO")) return "LISTO";
    if (detalles.some((d) => d.estado !== "SIN_ASIGNAR")) return "EN_COCINA";
    return "SIN_ASIGNAR";
  }

  function handleAsignar(detalleId: number) {
    setComandas((prev) =>
      prev.map((c) => {
        const newDetalles = c.detalles.map((d) =>
          d.id === detalleId
            ? { ...d, estado: "EN_PROCESO" as const, empleadoNombre: "Yo" }
            : d
        );
        return { ...c, detalles: newDetalles, estadoComanda: deriveEstado(newDetalles) };
      })
    );
    startTransition(async () => { await asignarDetalle(detalleId); });
  }

  function handleDesasignar(detalleId: number) {
    setComandas((prev) =>
      prev.map((c) => {
        const newDetalles = c.detalles.map((d) =>
          d.id === detalleId
            ? { ...d, estado: "SIN_ASIGNAR" as const, empleadoId: null, empleadoNombre: null }
            : d
        );
        return { ...c, detalles: newDetalles, estadoComanda: deriveEstado(newDetalles) };
      })
    );
    startTransition(async () => { await desasignarDetalle(detalleId); });
  }

  function handleRequestCompletar(detalleId: number, platoNombre: string) {
    setPendingConfirm({ detalleId, platoNombre });
  }

  function handleConfirmCompletar() {
    if (!pendingConfirm) return;
    const { detalleId } = pendingConfirm;
    setPendingConfirm(null);

    setComandas((prev) =>
      prev.map((c) => {
        const newDetalles = c.detalles.map((d) =>
          d.id === detalleId ? { ...d, estado: "LISTO" as const } : d
        );
        return { ...c, detalles: newDetalles, estadoComanda: deriveEstado(newDetalles) };
      })
    );
    startTransition(async () => { await completarDetalle(detalleId); });
  }

  function handleSimular() {
    startTransition(async () => {
      const nueva = await simularPedido();
      setComandas((prev) => [...prev, nueva]);
    });
  }

  return (
    <>
      {pendingConfirm && (
        <ConfirmListoDialog
          open={true}
          platoNombre={pendingConfirm.platoNombre}
          onConfirm={handleConfirmCompletar}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleSimular}
          title="Simula un pedido entrante desde la app de delivery"
        >
          <PlayIcon className="size-4" />
          Simular pedido
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map(({ estado, label, color }) => {
          const col = comandas.filter((c) => c.estadoComanda === estado);

          return (
            <section key={estado} className="flex flex-col gap-3">
              <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color}`}>
                <span className="text-sm font-semibold">{label}</span>
                <Badge variant="outline" className="border-current text-current text-xs">
                  {col.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {col.length === 0 ? (
                  <p className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-sm">
                    Sin comandas
                  </p>
                ) : (
                  col.map((c) => (
                    <ComandaCard
                      key={c.id}
                      comanda={c}
                      onAsignar={handleAsignar}
                      onDesasignar={handleDesasignar}
                      onRequestCompletar={handleRequestCompletar}
                      pending={isPending}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
