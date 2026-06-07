"use client";

import { useState, useTransition } from "react";
import { PlusIcon, ArrowUpDownIcon, ClockIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ArticuloStock, TipoMov, UnidadMedida } from "@/models";
import { UNIDADES_MEDIDA, TIPOS_MOV } from "@/models";
import {
  createArticulo,
  updateArticulo,
  deleteArticulo,
  registrarMovimiento,
} from "@/controllers/stock.controller";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIPO_MOV_BADGE: Record<TipoMov, string> = {
  INGRESO: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  EGRESO:  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  AJUSTE:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  MERMA:   "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// ArticuloDialog — create / edit
// ---------------------------------------------------------------------------

type ArticuloForm = {
  nombre: string;
  descripcion: string;
  esIngrediente: boolean;
  unidadMedida: UnidadMedida | "";
  cantidadInicial: string;
  minimo: string;
};

const EMPTY_FORM: ArticuloForm = {
  nombre: "",
  descripcion: "",
  esIngrediente: false,
  unidadMedida: "",
  cantidadInicial: "0",
  minimo: "",
};

function ArticuloDialog({
  open,
  articulo,
  onClose,
  onSave,
  pending,
}: {
  open: boolean;
  articulo: ArticuloStock | null;
  onClose: () => void;
  onSave: (form: ArticuloForm) => void;
  pending: boolean;
}) {
  const isEdit = Boolean(articulo);
  const [form, setForm] = useState<ArticuloForm>(
    articulo
      ? {
          nombre: articulo.nombre,
          descripcion: articulo.descripcion ?? "",
          esIngrediente: articulo.esIngrediente,
          unidadMedida: articulo.unidadMedida ?? "",
          cantidadInicial: "0",
          minimo: articulo.minimo?.toString() ?? "",
        }
      : EMPTY_FORM
  );

  function set(k: keyof ArticuloForm, v: ArticuloForm[keyof ArticuloForm]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleOpenChange(o: boolean) {
    if (!o) onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Modificá los datos del artículo." : "Completá los datos para agregar un nuevo artículo al stock."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.esIngrediente ? "ingrediente" : "producto"}
                  onValueChange={(v) => set("esIngrediente", v === "ingrediente")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingrediente">Ingrediente</SelectItem>
                    <SelectItem value="producto">Producto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Unidad de medida</Label>
                <Select
                  value={form.unidadMedida}
                  onValueChange={(v) => set("unidadMedida", v as UnidadMedida)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIDADES_MEDIDA).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {!isEdit && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cantidadInicial">Cantidad inicial</Label>
                  <Input
                    id="cantidadInicial"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cantidadInicial}
                    onChange={(e) => set("cantidadInicial", e.target.value)}
                  />
                </div>
              )}
              <div className={`flex flex-col gap-1.5 ${!isEdit ? "" : "col-span-2"}`}>
                <Label htmlFor="minimo">Stock mínimo</Label>
                <Input
                  id="minimo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Sin mínimo"
                  value={form.minimo}
                  onChange={(e) => set("minimo", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending || !form.nombre.trim()}>
              {isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MovimientoDialog
// ---------------------------------------------------------------------------

type MovForm = { tipoMov: TipoMov; cantidad: string; fecha: string };
const EMPTY_MOV: MovForm = { tipoMov: "INGRESO", cantidad: "", fecha: today() };

function MovimientoDialog({
  open,
  articulo,
  onClose,
  onSave,
  pending,
}: {
  open: boolean;
  articulo: ArticuloStock | null;
  onClose: () => void;
  onSave: (form: MovForm) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState<MovForm>(EMPTY_MOV);
  function set(k: keyof MovForm, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>
              {articulo?.nombre} — existencia actual:{" "}
              <strong>{articulo?.cantidad ?? 0} {articulo?.unidadMedida ?? ""}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tipo de movimiento</Label>
              <Select value={form.tipoMov} onValueChange={(v) => v && set("tipoMov", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_MOV).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.cantidad}
                  onChange={(e) => set("cantidad", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => set("fecha", e.target.value)}
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending || !form.cantidad}>Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// HistorialDialog
// ---------------------------------------------------------------------------

function HistorialDialog({
  open,
  articulo,
  onClose,
}: {
  open: boolean;
  articulo: ArticuloStock | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de movimientos</DialogTitle>
          <DialogDescription>{articulo?.nombre}</DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          {!articulo?.movimientos.length ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Sin movimientos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articulo.movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{m.fecha}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_MOV_BADGE[m.tipoMov]}`}>
                        {TIPOS_MOV[m.tipoMov]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{m.cantidad}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmDialog
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  open,
  articulo,
  onConfirm,
  onCancel,
  pending,
}: {
  open: boolean;
  articulo: ArticuloStock | null;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Eliminar artículo?</DialogTitle>
          <DialogDescription>
            Se eliminará <strong>{articulo?.nombre}</strong> y su historial de stock.
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>Eliminar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// StockView
// ---------------------------------------------------------------------------

type DialogKind = "articulo" | "movimiento" | "historial" | "delete" | null;

export function StockView({ initial }: { initial: ArticuloStock[] }) {
  const [articulos, setArticulos] = useState<ArticuloStock[]>(initial);
  const [isPending, startTransition] = useTransition();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [target, setTarget] = useState<ArticuloStock | null>(null);

  function open(kind: DialogKind, art?: ArticuloStock) {
    setTarget(art ?? null);
    setDialog(kind);
  }
  function close() { setDialog(null); setTarget(null); }

  // ---- Create / Edit ----
  function handleSaveArticulo(form: ArticuloForm) {
    const minimo = form.minimo ? parseFloat(form.minimo) : null;
    const cantidadInicial = parseFloat(form.cantidadInicial) || 0;
    const unidadMedida = form.unidadMedida || null;

    if (target) {
      // Optimistic edit
      setArticulos((prev) =>
        prev.map((a) =>
          a.id === target.id
            ? { ...a, nombre: form.nombre.trim(), descripcion: form.descripcion || null, esIngrediente: form.esIngrediente, unidadMedida, minimo }
            : a
        ).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      );
      close();
      startTransition(async () => {
        await updateArticulo(target.id, { nombre: form.nombre.trim(), descripcion: form.descripcion || null, esIngrediente: form.esIngrediente, unidadMedida, minimo });
      });
    } else {
      // Optimistic create
      const tempId = Date.now();
      const newArt: ArticuloStock = {
        id: tempId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion || null,
        esIngrediente: form.esIngrediente,
        unidadMedida,
        stockId: 0,
        cantidad: cantidadInicial,
        minimo,
        movimientos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };
      setArticulos((prev) => [...prev, newArt].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      close();
      startTransition(async () => {
        const fresh = await createArticulo({ nombre: form.nombre.trim(), descripcion: form.descripcion || null, esIngrediente: form.esIngrediente, unidadMedida, cantidadInicial, minimo });
        setArticulos((prev) =>
          prev.map((a) => (a.id === tempId ? fresh : a)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        );
      });
    }
  }

  // ---- Movimiento ----
  function handleSaveMovimiento(form: MovForm) {
    if (!target) return;
    const cantidad = parseFloat(form.cantidad);
    let nuevaCantidad = target.cantidad;
    switch (form.tipoMov) {
      case "INGRESO": nuevaCantidad += cantidad; break;
      case "EGRESO": case "MERMA": nuevaCantidad = Math.max(0, nuevaCantidad - cantidad); break;
      case "AJUSTE": nuevaCantidad = cantidad; break;
    }
    const now = new Date().toISOString();
    const tempMov = { id: Date.now(), stockId: target.stockId, tipoMov: form.tipoMov, cantidad, fecha: form.fecha, createdAt: now, updatedAt: now, deletedAt: null };

    setArticulos((prev) =>
      prev.map((a) =>
        a.id === target.id
          ? { ...a, cantidad: nuevaCantidad, movimientos: [tempMov, ...a.movimientos] }
          : a
      )
    );
    close();
    startTransition(async () => {
      await registrarMovimiento(target.id, { tipoMov: form.tipoMov, cantidad, fecha: form.fecha });
    });
  }

  // ---- Delete ----
  function handleDelete() {
    if (!target) return;
    setArticulos((prev) => prev.filter((a) => a.id !== target.id));
    close();
    startTransition(async () => { await deleteArticulo(target.id); });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open("articulo")} size="sm">
          <PlusIcon className="size-4" />
          Nuevo artículo
        </Button>
      </div>

      {/* Table */}
      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Existencia</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {articulos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                  Sin artículos. Creá uno con el botón de arriba.
                </TableCell>
              </TableRow>
            ) : (
              articulos.map((art) => {
                const bajo = (art.minimo ?? 0) > 0 && art.cantidad <= (art.minimo ?? 0);
                return (
                  <TableRow key={art.id}>
                    <TableCell>
                      <p className="font-medium">{art.nombre}</p>
                      {art.descripcion && (
                        <p className="text-muted-foreground text-xs">{art.descripcion}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={art.esIngrediente ? "outline" : "secondary"}>
                        {art.esIngrediente ? "Ingrediente" : "Producto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {art.unidadMedida ? UNIDADES_MEDIDA[art.unidadMedida] : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{art.cantidad}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {art.minimo ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={bajo ? "destructive" : "secondary"}>
                        {bajo ? "Bajo" : "OK"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Registrar movimiento"
                          disabled={isPending}
                          onClick={() => open("movimiento", art)}
                        >
                          <ArrowUpDownIcon className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Ver historial"
                          disabled={isPending}
                          onClick={() => open("historial", art)}
                        >
                          <ClockIcon className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Editar"
                          disabled={isPending}
                          onClick={() => open("articulo", art)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Eliminar"
                          disabled={isPending}
                          onClick={() => open("delete", art)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <ArticuloDialog
        key={target?.id ?? "new"}
        open={dialog === "articulo"}
        articulo={target}
        onClose={close}
        onSave={handleSaveArticulo}
        pending={isPending}
      />
      <MovimientoDialog
        open={dialog === "movimiento"}
        articulo={target}
        onClose={close}
        onSave={handleSaveMovimiento}
        pending={isPending}
      />
      <HistorialDialog
        open={dialog === "historial"}
        articulo={target}
        onClose={close}
      />
      <DeleteConfirmDialog
        open={dialog === "delete"}
        articulo={target}
        onConfirm={handleDelete}
        onCancel={close}
        pending={isPending}
      />
    </>
  );
}
