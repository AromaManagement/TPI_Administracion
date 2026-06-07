import { PageHeader } from "@/components/layout/page-header";
import { LoadError } from "@/components/layout/load-error";
import { UsuariosView } from "@/views/usuarios/usuarios-view";
import { usuarioService } from "@/services/usuario.service";
import { ApiError } from "@/lib/api";
import type { Usuario } from "@/models";

export default async function UsuariosPage() {
  let usuarios: Usuario[] = [];
  let error: string | null = null;

  try {
    usuarios = await usuarioService.getAll();
  } catch (e) {
    error = e instanceof ApiError ? e.message : "Error desconocido.";
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="ABM de usuarios del sistema: administradores y cocineros."
      />
      {error ? (
        <LoadError message={error} />
      ) : (
        <UsuariosView usuarios={usuarios} />
      )}
    </>
  );
}
