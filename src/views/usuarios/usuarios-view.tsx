"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  createUsuarioAction,
  updateUsuarioAction,
  deleteUsuarioAction,
} from "@/controllers/usuario.controller";
import { formatDate } from "@/lib/format";
import { ROLES } from "@/models";
import type { ActionResult, Rol, Usuario } from "@/models";

const ROL_OPTIONS: { value: Rol; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "COCINERO", label: "Cocinero" },
  { value: "CLIENTE", label: "Cliente (app delivery)" },
  { value: "REPARTIDOR", label: "Repartidor (app delivery)" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}

function UsuarioDialog({
  open,
  onOpenChange,
  usuario,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  usuario: Usuario | null;
}) {
  const isEdit = Boolean(usuario);
  const action = usuario
    ? updateUsuarioAction.bind(null, usuario.id)
    : createUsuarioAction;

  const [state, formAction] = useActionState<
    ActionResult<Usuario> | null,
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
      <DialogContent className="max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
            <DialogDescription>
              Credenciales de acceso y perfil del usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={usuario?.nombre ?? ""}
                  placeholder="Juan"
                  required
                />
                {errors?.nombre && (
                  <p className="text-destructive text-sm">{errors.nombre[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  defaultValue={usuario?.apellido ?? ""}
                  placeholder="García"
                  required
                />
                {errors?.apellido && (
                  <p className="text-destructive text-sm">
                    {errors.apellido[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Correo */}
            <div className="space-y-2">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                defaultValue={usuario?.correo ?? ""}
                placeholder="usuario@aromasdevina.com"
                required
              />
              {errors?.correo && (
                <p className="text-destructive text-sm">{errors.correo[0]}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="contrasena">
                Contraseña{" "}
                {isEdit && (
                  <span className="text-muted-foreground text-xs">
                    (dejar vacío para no cambiar)
                  </span>
                )}
              </Label>
              <Input
                id="contrasena"
                name="contrasena"
                type="password"
                required={!isEdit}
              />
              {errors?.contrasena && (
                <p className="text-destructive text-sm">
                  {errors.contrasena[0]}
                </p>
              )}
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <select
                id="rol"
                name="rol"
                defaultValue={usuario?.rol ?? ""}
                required
                className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
              >
                <option value="" disabled>
                  Seleccionar rol
                </option>
                {ROL_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors?.rol && (
                <p className="text-destructive text-sm">{errors.rol[0]}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <SubmitButton label={isEdit ? "Guardar cambios" : "Crear usuario"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsuariosView({ usuarios }: { usuarios: Usuario[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(usuario: Usuario) {
    setEditing(usuario);
    setDialogOpen(true);
  }

  async function handleDelete(usuario: Usuario) {
    if (
      !confirm(
        `¿Eliminar el usuario "${usuario.nombre} ${usuario.apellido}" (${usuario.correo})?`,
      )
    )
      return;
    const result = await deleteUsuarioAction(usuario.id);
    if (result.ok) toast.success(result.message ?? "Usuario eliminado.");
    else toast.error(result.error);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center"
                >
                  No hay usuarios cargados.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="text-muted-foreground">
                    {usuario.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {usuario.nombre} {usuario.apellido}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.correo}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLES[usuario.rol]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(usuario.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(usuario)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(usuario)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={editing}
      />
    </>
  );
}
