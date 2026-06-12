"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangleIcon,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  createSeccionAction,
  updateSeccionAction,
  deleteSeccionAction,
  createPlatoAction,
  updatePlatoAction,
  deletePlatoAction,
} from "@/controllers/carta.controller";
import { formatCurrency } from "@/lib/format";
import type { ActionResult, ArticuloStock, Carta, Seccion, Plato } from "@/models";

// ---------------------------------------------------------------------------
// Image resize helper (runs in the browser via Canvas API)
// Produces a JPEG data URL at most `maxSide` px on the longest side.
// ---------------------------------------------------------------------------

function resizeImage(file: File, size = 400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      // Center-crop to square, then scale to `size`
      const side = Math.min(w, h);
      const sx = Math.round((w - side) / 2);
      const sy = Math.round((h - side) / 2);
      const out = Math.min(side, size);
      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      canvas.getContext("2d")!.drawImage(img, sx, sy, side, side, 0, 0, out, out);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ---------------------------------------------------------------------------
// Shared submit button
// ---------------------------------------------------------------------------

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// SeccionDialog
// ---------------------------------------------------------------------------

function SeccionDialog({
  open,
  onOpenChange,
  seccion,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seccion: Seccion | null;
}) {
  const isEdit = Boolean(seccion);
  const action = seccion
    ? updateSeccionAction.bind(null, seccion.id)
    : createSeccionAction;

  const [state, formAction] = useActionState<
    ActionResult<Seccion> | null,
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
      <DialogContent className="max-w-md">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar sección" : "Nueva sección"}
            </DialogTitle>
            <DialogDescription>
              Agrupa los platos de la carta por categoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="s-nombre">Nombre</Label>
              <Input
                id="s-nombre"
                name="nombre"
                defaultValue={seccion?.nombre ?? ""}
                placeholder="Ej: Entradas"
                required
              />
              {errors?.nombre && (
                <p className="text-destructive text-sm">{errors.nombre[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="s-detalle">
                Descripción{" "}
                <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Textarea
                id="s-detalle"
                name="detalle"
                defaultValue={seccion?.detalle ?? ""}
                placeholder="Ej: Para comenzar"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <SubmitButton label={isEdit ? "Guardar cambios" : "Crear sección"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// IngredientesPicker
// ---------------------------------------------------------------------------

interface IngItem {
  articuloId: number;
  nombre: string;
  cantidad: number;
  unidadMedida: string | null;
}

function IngredientesPicker({
  value,
  onChange,
  articulos,
}: {
  value: IngItem[];
  onChange: (v: IngItem[]) => void;
  articulos: ArticuloStock[];
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [qty, setQty] = useState<string>("");

  const available = articulos.filter(
    (a) => !value.some((v) => v.articuloId === a.id),
  );

  function handleAdd() {
    const id = parseInt(selectedId, 10);
    const cantidad = parseFloat(qty);
    if (!id || isNaN(cantidad) || cantidad <= 0) return;
    const art = articulos.find((a) => a.id === id);
    if (!art) return;
    onChange([
      ...value,
      { articuloId: id, nombre: art.nombre, cantidad, unidadMedida: art.unidadMedida ?? null },
    ]);
    setSelectedId("");
    setQty("");
  }

  function handleRemove(articuloId: number) {
    onChange(value.filter((v) => v.articuloId !== articuloId));
  }

  function handleQtyChange(articuloId: number, raw: string) {
    const n = parseFloat(raw);
    if (isNaN(n) || n < 0) return;
    onChange(value.map((v) => (v.articuloId === articuloId ? { ...v, cantidad: n } : v)));
  }

  return (
    <div className="space-y-2">
      {/* Add row */}
      <div className="flex gap-2">
        <select
          className="border-input bg-background flex h-9 flex-1 rounded-md border px-3 py-1 text-sm shadow-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Seleccionar artículo…</option>
          {available.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}{a.unidadMedida ? ` (${a.unidadMedida})` : ""}
            </option>
          ))}
        </select>
        <Input
          className="w-24"
          type="number"
          min="0"
          step="0.01"
          placeholder="Cant."
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={!selectedId || !qty}>
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Current list */}
      {value.length > 0 && (
        <ul className="divide-y rounded-md border text-sm">
          {value.map((ing) => {
            const art = articulos.find((a) => a.id === ing.articuloId);
            const stockOk = art ? art.cantidad >= ing.cantidad : true;
            return (
              <li key={ing.articuloId} className="flex items-center gap-2 px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate">{ing.nombre}</span>
                <Input
                  className="h-7 w-20 text-xs"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ing.cantidad}
                  onChange={(e) => handleQtyChange(ing.articuloId, e.target.value)}
                />
                <span className="text-muted-foreground w-10 shrink-0 text-xs">
                  {ing.unidadMedida ?? ""}
                </span>
                {!stockOk && (
                  <AlertTriangleIcon className="size-3.5 shrink-0 text-amber-500" />
                )}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(ing.articuloId)}
                >
                  <XIcon className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {available.length === 0 && value.length === articulos.length && (
        <p className="text-muted-foreground text-xs">
          Todos los artículos de stock ya están en la receta.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlatoDialog
// ---------------------------------------------------------------------------

function PlatoDialog({
  open,
  onOpenChange,
  plato,
  seccionId,
  articulos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plato: Plato | null;
  seccionId: number | null;
  articulos: ArticuloStock[];
}) {
  const isEdit = Boolean(plato);
  const action = plato
    ? updatePlatoAction.bind(null, plato.id)
    : createPlatoAction;

  const [state, formAction] = useActionState<
    ActionResult<Plato> | null,
    FormData
  >(action, null);

  const [preview, setPreview] = useState<string | null>(
    plato?.imagen?.imagenSi ?? null,
  );
  const [imageChanged, setImageChanged] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Ingredient state: initialize from plato (if editing)
  const [ingredientes, setIngredientes] = useState<IngItem[]>(() =>
    (plato?.ingredientes ?? []).map((ing) => ({
      articuloId: ing.articuloId,
      nombre: ing.nombre,
      cantidad: ing.cantidad,
      unidadMedida: ing.unidadMedida,
    })),
  );

  // Reset state when dialog opens with a different plato
  useEffect(() => {
    setPreview(plato?.imagen?.imagenSi ?? null);
    setImageChanged(false);
    setIngredientes(
      (plato?.ingredientes ?? []).map((ing) => ({
        articuloId: ing.articuloId,
        nombre: ing.nombre,
        cantidad: ing.cantidad,
        unidadMedida: ing.unidadMedida,
      })),
    );
  }, [plato, open]);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Guardado.");
      onOpenChange(false);
    } else if (state && !state.ok && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, onOpenChange]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImage(file, 600, 0.82).then((dataUrl) => {
      setPreview(dataUrl);
      setImageChanged(true);
    });
  }

  function clearImage() {
    setPreview(null);
    setImageChanged(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form action={formAction}>
          {/* Pass seccionId as hidden field for create */}
          {!isEdit && (
            <input type="hidden" name="seccionId" value={seccionId ?? ""} />
          )}
          {/* Image is resized client-side; send data URL + changed flag */}
          <input type="hidden" name="imagenDataUrl" value={imageChanged ? (preview ?? "") : ""} />
          <input type="hidden" name="imagenChanged" value={imageChanged ? "1" : "0"} />
          {/* Ingredients serialized as JSON */}
          <input
            type="hidden"
            name="ingredientesJson"
            value={JSON.stringify(
              ingredientes.map((i) => ({ articuloId: i.articuloId, cantidad: i.cantidad })),
            )}
          />

          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar plato" : "Nuevo plato"}</DialogTitle>
            <DialogDescription>
              Datos del producto que aparece en la carta.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4 pr-1">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="p-nombre">Nombre</Label>
              <Input
                id="p-nombre"
                name="nombre"
                defaultValue={plato?.nombre ?? ""}
                placeholder="Ej: Milanesa napolitana"
                required
              />
              {errors?.nombre && (
                <p className="text-destructive text-sm">{errors.nombre[0]}</p>
              )}
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label htmlFor="p-precio">Precio ($)</Label>
              <Input
                id="p-precio"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                defaultValue={plato?.precio ?? ""}
                placeholder="0.00"
                required
              />
              {errors?.precio && (
                <p className="text-destructive text-sm">{errors.precio[0]}</p>
              )}
            </div>

            {/* Detalle */}
            <div className="space-y-2">
              <Label htmlFor="p-detalle">
                Descripción{" "}
                <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Textarea
                id="p-detalle"
                name="detalle"
                defaultValue={plato?.detalle ?? ""}
                placeholder="Ej: Con papas fritas y ensalada"
                rows={2}
              />
            </div>

            {/* Ingredientes */}
            <div className="space-y-2">
              <Label>Ingredientes del stock</Label>
              {articulos.length === 0 ? (
                <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-sm">
                  Aún no hay artículos en stock.{" "}
                  <a href="/stock" className="underline underline-offset-2">
                    Agregá artículos en Stock
                  </a>{" "}
                  para poder asignarles ingredientes a los platos.
                </p>
              ) : (
                <IngredientesPicker
                  value={ingredientes}
                  onChange={setIngredientes}
                  articulos={articulos}
                />
              )}
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label>
                Imagen{" "}
                <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>

              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative size-32 overflow-hidden rounded-lg border">
                    <Image
                      src={preview}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Así se verá en la carta
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("p-imagen")?.click()}
                    >
                      Cambiar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={clearImage}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="p-imagen"
                  className="border-muted-foreground/30 hover:border-muted-foreground/60 flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
                >
                  <ImageIcon className="text-muted-foreground size-8" />
                  <span className="text-muted-foreground text-sm">
                    Hacer click para subir imagen
                  </span>
                </label>
              )}
              <input
                ref={fileRef}
                id="p-imagen"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFile}
              />
            </div>
          </div>

          <DialogFooter>
            <SubmitButton label={isEdit ? "Guardar cambios" : "Agregar plato"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// PlatoCard
// ---------------------------------------------------------------------------

function PlatoCard({
  plato,
  onEdit,
  onDelete,
}: {
  plato: Plato;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sinStock = plato.disponible === false;

  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
      {/* Image */}
      {plato.imagen ? (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-md border">
          <Image
            src={plato.imagen.imagenSi}
            alt={plato.nombre}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="bg-muted flex size-16 shrink-0 items-center justify-center rounded-md border">
          <UtensilsCrossed className="text-muted-foreground size-6" />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium">{plato.nombre}</p>
              {sinStock && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  <AlertTriangleIcon className="size-2.5" />
                  Sin stock
                </span>
              )}
            </div>
            {plato.detalle && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {plato.detalle}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm font-semibold">
            {formatCurrency(plato.precio)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onDelete}
        >
          <Trash2 className="text-destructive size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SeccionCard
// ---------------------------------------------------------------------------

function SeccionCard({
  seccion,
  articulos,
  onEditSeccion,
  onDeleteSeccion,
  onAddPlato,
  onEditPlato,
  onDeletePlato,
}: {
  seccion: Seccion;
  articulos: ArticuloStock[];
  onEditSeccion: () => void;
  onDeleteSeccion: () => void;
  onAddPlato: () => void;
  onEditPlato: (plato: Plato) => void;
  onDeletePlato: (plato: Plato) => void;
}) {
  const sinStockCount = (seccion.platos ?? []).filter((p) => p.disponible === false).length;

  return (
    <div className="bg-background flex flex-col rounded-lg border">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{seccion.nombre}</h3>
            <Badge variant="outline" className="text-xs">
              {seccion.platos?.length ?? 0}
            </Badge>
            {sinStockCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {sinStockCount} sin stock
              </Badge>
            )}
          </div>
          {seccion.detalle && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {seccion.detalle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onEditSeccion}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onDeleteSeccion}
          >
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Platos */}
      <div className="flex flex-col gap-2 p-4">
        {seccion.platos && seccion.platos.length > 0 ? (
          seccion.platos.map((plato) => (
            <PlatoCard
              key={plato.id}
              plato={plato}
              onEdit={() => onEditPlato(plato)}
              onDelete={() => onDeletePlato(plato)}
            />
          ))
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Sin platos en esta sección.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={onAddPlato}
        >
          <Plus className="mr-1.5 size-4" />
          Agregar plato
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CartaView (main)
// ---------------------------------------------------------------------------

export function CartaView({ carta, articulos }: { carta: Carta; articulos: ArticuloStock[] }) {
  // Separate open/data state so setters are stable references (avoids
  // infinite useEffect loops caused by inline arrow onOpenChange props)
  const [seccionOpen, setSeccionOpen] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);

  const [platoOpen, setPlatoOpen] = useState(false);
  const [editingPlato, setEditingPlato] = useState<Plato | null>(null);
  const [platoSeccionId, setPlatoSeccionId] = useState<number | null>(null);

  function openNewSeccion() {
    setEditingSeccion(null);
    setSeccionOpen(true);
  }

  function openEditSeccion(seccion: Seccion) {
    setEditingSeccion(seccion);
    setSeccionOpen(true);
  }

  async function handleDeleteSeccion(seccion: Seccion) {
    const platoCount = seccion.platos?.length ?? 0;
    const msg =
      platoCount > 0
        ? `¿Eliminar la sección "${seccion.nombre}" y sus ${platoCount} plato(s)?`
        : `¿Eliminar la sección "${seccion.nombre}"?`;
    if (!confirm(msg)) return;
    const result = await deleteSeccionAction(seccion.id);
    if (result.ok) toast.success(result.message ?? "Sección eliminada.");
    else toast.error(result.error);
  }

  function openNewPlato(seccionId: number) {
    setEditingPlato(null);
    setPlatoSeccionId(seccionId);
    setPlatoOpen(true);
  }

  function openEditPlato(plato: Plato) {
    setEditingPlato(plato);
    setPlatoSeccionId(plato.seccionId);
    setPlatoOpen(true);
  }

  async function handleDeletePlato(plato: Plato) {
    if (!confirm(`¿Eliminar el plato "${plato.nombre}"?`)) return;
    const result = await deletePlatoAction(plato.id);
    if (result.ok) toast.success(result.message ?? "Plato eliminado.");
    else toast.error(result.error);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNewSeccion}>
          <Plus className="mr-2 size-4" />
          Nueva sección
        </Button>
      </div>

      {!carta.secciones?.length ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <UtensilsCrossed className="text-muted-foreground size-12" />
          <p className="text-muted-foreground">
            Todavía no hay secciones. Crea la primera para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {carta.secciones.map((seccion) => (
            <SeccionCard
              key={seccion.id}
              seccion={seccion}
              articulos={articulos}
              onEditSeccion={() => openEditSeccion(seccion)}
              onDeleteSeccion={() => handleDeleteSeccion(seccion)}
              onAddPlato={() => openNewPlato(seccion.id)}
              onEditPlato={openEditPlato}
              onDeletePlato={handleDeletePlato}
            />
          ))}
        </div>
      )}

      <SeccionDialog
        open={seccionOpen}
        onOpenChange={setSeccionOpen}
        seccion={editingSeccion}
      />

      <PlatoDialog
        key={editingPlato?.id ?? "new"}
        open={platoOpen}
        onOpenChange={setPlatoOpen}
        plato={editingPlato}
        seccionId={platoSeccionId}
        articulos={articulos}
      />
    </>
  );
}
