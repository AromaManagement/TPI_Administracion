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
import { MapPin, ChefHat } from "lucide-react";
import type { CocinaComanda, CocinaDetalle, EstadoComanda, EstadoDetalle } from "@/models";
import { formatDateTime } from "@/lib/format";
import {
  tomarDetalle,
  completarDetalle,
  desasignarDetalle,
} from "@/controllers/cocina.controller";

export interface Cocinero {
  id: number;
  nombre: string;
  apellido: string;
}

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

const COLUMNS: { estado: EstadoComanda; label: string; color: string }[] = [
  { estado: "SIN_ASIGNAR", label: "Sin asignar", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400" },
  { estado: "EN_COCINA",   label: "En cocina",   color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" },
  { estado: "LISTO",       label: "Listo",        color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" },
];

const DETALLE_BADGE: Record<EstadoDetalle, string> = {
  SIN_ASIGNAR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  EN_COCINA:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  LISTO:       "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const DETALLE_LABEL: Record<EstadoDetalle, string> = {
  SIN_ASIGNAR: "Sin asignar",
  EN_COCINA:   "En cocina",
  LISTO:       "Listo",
};

// ---------------------------------------------------------------------------
// AsignarCocineroDialog
// ---------------------------------------------------------------------------

function AsignarCocineroDialog({
  open,
  cocineros,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  cocineros: Cocinero[];
  onConfirm: (chefId: number) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleConfirm(chefId: number) {
    setSelected(null);
    onConfirm(chefId);
  }

  function handleCancel() {
    setSelected(null);
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar cocinero</DialogTitle>
          <DialogDescription>
            Seleccioná el cocinero que va a preparar este plato.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          {cocineros.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">No hay cocineros disponibles.</p>
          )}
          {cocineros.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                selected === c.id
                  ? "border-primary bg-primary/5 font-semibold"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                {c.nombre[0]}{c.apellido[0]}
              </div>
              {c.nombre} {c.apellido}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button disabled={!selected} onClick={() => selected && handleConfirm(selected)}>
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Marcar como listo?</DialogTitle>
          <DialogDescription>
            Estás por marcar <strong>{platoNombre}</strong> como listo.
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
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
  onTomar,
  onRequestCompletar,
  onDesasignar,
  pending,
}: {
  detalle: CocinaDetalle;
  onTomar: (id: number) => void;
  onRequestCompletar: (id: number, nombre: string) => void;
  onDesasignar: (id: number) => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{detalle.platoNombre}</p>
        {detalle.empleadoNombre && (
          <p className="text-muted-foreground text-xs mt-0.5">{detalle.empleadoNombre}</p>
        )}
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DETALLE_BADGE[detalle.estadoDetalle]}`}>
          {DETALLE_LABEL[detalle.estadoDetalle]}
        </span>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {detalle.estadoDetalle === "SIN_ASIGNAR" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={pending}
            onClick={() => onTomar(detalle.id)}
          >
            <ChefHat className="size-3 mr-1" />
            Asignar
          </Button>
        )}
        {detalle.estadoDetalle === "EN_COCINA" && (
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
  onTomarDetalle,
  onRequestCompletarDetalle,
  onDesasignarDetalle,
  pending,
}: {
  comanda: CocinaComanda;
  onTomarDetalle: (id: number) => void;
  onRequestCompletarDetalle: (id: number, nombre: string) => void;
  onDesasignarDetalle: (id: number) => void;
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

      <CardContent className="flex flex-col gap-2 pt-0 pb-3">
        {comanda.clienteNombre && (
          <p className="text-muted-foreground text-xs">{comanda.clienteNombre}</p>
        )}
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
            onTomar={onTomarDetalle}
            onRequestCompletar={onRequestCompletarDetalle}
            onDesasignar={onDesasignarDetalle}
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

export function CocinaView({ initial, cocineros }: { initial: CocinaComanda[]; cocineros: Cocinero[] }) {
  const [comandas, setComandas] = useState<CocinaComanda[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [pendingDetalleId, setPendingDetalleId] = useState<number | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  function handleTomarDetalle(detalleId: number) {
    setPendingDetalleId(detalleId);
  }

  function handleConfirmAsignar(chefId: number) {
    const detalleId = pendingDetalleId!;
    setPendingDetalleId(null);
    const cocinero = cocineros.find((c) => c.id === chefId);
    setComandas((prev) =>
      prev.map((c) => {
        if (!c.detalles.some((d) => d.id === detalleId)) return c;
        const updatedDetalles = c.detalles.map((d) =>
          d.id === detalleId
            ? { ...d, estadoDetalle: "EN_COCINA" as const, empleadoId: chefId, empleadoNombre: cocinero ? `${cocinero.nombre} ${cocinero.apellido}` : null }
            : d
        );
        const estadoComanda = c.estadoComanda === "SIN_ASIGNAR" ? ("EN_COCINA" as const) : c.estadoComanda;
        return { ...c, detalles: updatedDetalles, estadoComanda };
      })
    );
    startTransition(async () => { await tomarDetalle(detalleId, chefId); });
  }

  function handleRequestCompletarDetalle(detalleId: number, platoNombre: string) {
    setPendingConfirm({ detalleId, platoNombre });
  }

  function handleConfirmCompletar() {
    if (!pendingConfirm) return;
    const { detalleId } = pendingConfirm;
    setPendingConfirm(null);
    setComandas((prev) =>
      prev.map((c) => {
        if (!c.detalles.some((d) => d.id === detalleId)) return c;
        const updatedDetalles = c.detalles.map((d) =>
          d.id === detalleId ? { ...d, estadoDetalle: "LISTO" as const } : d
        );
        const todosListos = updatedDetalles.every((d) => d.estadoDetalle === "LISTO");
        return {
          ...c,
          detalles: updatedDetalles,
          estadoComanda: todosListos ? ("LISTO" as const) : c.estadoComanda,
        };
      })
    );
    startTransition(async () => { await completarDetalle(detalleId); });
  }

  function handleDesasignarDetalle(detalleId: number) {
    setComandas((prev) =>
      prev.map((c) => {
        if (!c.detalles.some((d) => d.id === detalleId)) return c;
        const updatedDetalles = c.detalles.map((d) =>
          d.id === detalleId ? { ...d, estadoDetalle: "SIN_ASIGNAR" as const, empleadoNombre: null, empleadoId: null } : d
        );
        const todosLibres = updatedDetalles.every((d) => d.estadoDetalle === "SIN_ASIGNAR");
        return {
          ...c,
          detalles: updatedDetalles,
          estadoComanda: todosLibres ? ("SIN_ASIGNAR" as const) : c.estadoComanda,
        };
      })
    );
    startTransition(async () => { await desasignarDetalle(detalleId); });
  }

  return (
    <>
      <AsignarCocineroDialog
        open={pendingDetalleId !== null}
        cocineros={cocineros}
        onConfirm={handleConfirmAsignar}
        onCancel={() => setPendingDetalleId(null)}
      />
      {pendingConfirm && (
        <ConfirmListoDialog
          open={true}
          platoNombre={pendingConfirm.platoNombre}
          onConfirm={handleConfirmCompletar}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

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
                      onTomarDetalle={handleTomarDetalle}
                      onRequestCompletarDetalle={handleRequestCompletarDetalle}
                      onDesasignarDetalle={handleDesasignarDetalle}
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
