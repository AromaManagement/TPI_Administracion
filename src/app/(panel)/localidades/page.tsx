import { PageHeader } from "@/components/layout/page-header";
import { LoadError } from "@/components/layout/load-error";
import { LocalidadesView } from "@/views/localidades/localidades-view";
import { localidadService } from "@/services/localidad.service";
import { ApiError } from "@/lib/api";
import type { Localidad } from "@/models";

export default async function LocalidadesPage() {
  let localidades: Localidad[] = [];
  let error: string | null = null;

  try {
    localidades = await localidadService.getAll();
  } catch (e) {
    error = e instanceof ApiError ? e.message : "Error desconocido.";
  }

  return (
    <>
      <PageHeader
        title="Localidades"
        description="Localidades para las direcciones de entrega de los pedidos."
      />
      {error ? (
        <LoadError message={error} />
      ) : (
        <LocalidadesView localidades={localidades} />
      )}
    </>
  );
}
