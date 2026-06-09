"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import { MapPin } from "lucide-react";
import type { CocinaComanda, CocinaDetalle, EstadoComanda } from "@/models";
import { formatDateTime } from "@/lib/format";
import { tomarComanda, completarComanda } from "@/controllers/cocina.controller";

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

const COLUMNS: { estado: EstadoComanda; label: string; color: string }[] = [
  { estado: "SIN_ASIGNAR", label: "Sin asignar", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400" },
  { estado: "EN_COCINA",   label: "En cocina",   color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" },
  { estado: "LISTO",       label: "Listo",        color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" },
];

// ---------------------------------------------------------------------------
// ConfirmListoDialog
// ---------------------------------------------------------------------------

function ConfirmListoDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Marcar como lista?</DialogTitle>
          <DialogDescription>
            Todos los platos de esta comanda están listos para servir.
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

function DetalleRow({ detalle }: { detalle: CocinaDetalle }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{detalle.platoNombre}</p>
        {detalle.empleadoNombre && (
          <p className="text-muted-foreground mt-0.5 text-xs">{detalle.empleadoNombre}</p>
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
  onTomar,
  onRequestCompletar,
  pending,
}: {
  comanda: CocinaComanda;
  onTomar: (id: number) => void;
  onRequestCompletar: (id: number) => void;
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
          <DetalleRow key={det.id} detalle={det} />
        ))}
      </CardContent>

      {(comanda.estadoComanda === "SIN_ASIGNAR" || comanda.estadoComanda === "EN_COCINA") && (
        <CardFooter className="pt-0">
          {comanda.estadoComanda === "SIN_ASIGNAR" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              disabled={pending}
              onClick={() => onTomar(comanda.id)}
            >
              Tomar comanda
            </Button>
          )}
          {comanda.estadoComanda === "EN_COCINA" && (
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              disabled={pending}
              onClick={() => onRequestCompletar(comanda.id)}
            >
              Marcar lista
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CocinaView
// ---------------------------------------------------------------------------

export function CocinaView({ initial }: { initial: CocinaComanda[] }) {
  const [comandas, setComandas] = useState<CocinaComanda[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function handleTomar(comandaId: number) {
    setComandas((prev) =>
      prev.map((c) =>
        c.id === comandaId ? { ...c, estadoComanda: "EN_COCINA" as const } : c,
      ),
    );
    startTransition(async () => { await tomarComanda(comandaId); });
  }

  function handleConfirmCompletar() {
    if (confirmId === null) return;
    const id = confirmId;
    setConfirmId(null);
    setComandas((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, estadoComanda: "LISTO" as const } : c,
      ),
    );
    startTransition(async () => { await completarComanda(id); });
  }

  return (
    <>
      {confirmId !== null && (
        <ConfirmListoDialog
          open={true}
          onConfirm={handleConfirmCompletar}
          onCancel={() => setConfirmId(null)}
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
                      onTomar={handleTomar}
                      onRequestCompletar={setConfirmId}
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
