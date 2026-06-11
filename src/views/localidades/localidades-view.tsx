"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createLocalidadAction,
  updateLocalidadAction,
  deleteLocalidadAction,
} from "@/controllers/localidad.controller";
import { formatDate } from "@/lib/format";
import type { ActionResult, Localidad } from "@/models";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}

function LocalidadDialog({
  open,
  onOpenChange,
  localidad,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  localidad: Localidad | null;
}) {
  const action = localidad
    ? updateLocalidadAction.bind(null, localidad.id)
    : createLocalidadAction;

  const [state, formAction] = useActionState<
    ActionResult<Localidad> | null,
    FormData
  >(action, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Guardado.");
      onOpenChange(false);
    } else if (state && !state.ok && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, onOpenChange]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>
              {localidad ? "Editar localidad" : "Nueva localidad"}
            </DialogTitle>
            <DialogDescription>
              Localidades usadas en las direcciones de entrega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={localidad?.nombre ?? ""}
              placeholder="Ej: Godoy Cruz"
              required
            />
            {errors?.nombre && (
              <p className="text-destructive text-sm">{errors.nombre[0]}</p>
            )}
          </div>

          <DialogFooter>
            <SubmitButton
              label={localidad ? "Guardar cambios" : "Crear localidad"}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LocalidadesView({ localidades }: { localidades: Localidad[] }) {
  const [items, setItems] = useState(localidades);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Localidad | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync if server re-renders with fresh data
  useEffect(() => { setItems(localidades); }, [localidades]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(localidad: Localidad) {
    setEditing(localidad);
    setDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (deletingId === null) return;
    setIsDeleting(true);
    setItems((prev) => prev.filter((l) => l.id !== deletingId));
    const result = await deleteLocalidadAction(deletingId);
    if (result.ok) toast.success(result.message ?? "Localidad eliminada.");
    else {
      setItems(localidades);
      toast.error(result.error);
    }
    setDeletingId(null);
    setIsDeleting(false);
  }

  return (
    <>
      <AlertDialog open={deletingId !== null} onOpenChange={(o) => { if (!o) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar localidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la localidad permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Nueva localidad
        </Button>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  No hay localidades cargadas.
                </TableCell>
              </TableRow>
            ) : (
              items.map((localidad) => (
                <TableRow key={localidad.id}>
                  <TableCell className="text-muted-foreground">{localidad.id}</TableCell>
                  <TableCell className="font-medium">{localidad.nombre}</TableCell>
                  <TableCell>{formatDate(localidad.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(localidad)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingId(localidad.id)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LocalidadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        localidad={editing}
      />
    </>
  );
}
