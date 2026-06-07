import { PageHeader } from "@/components/layout/page-header";
import { cocinaService } from "@/services/cocina.service";
import { CocinaView } from "@/views/cocina/cocina-view";

export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  const comandas = await cocinaService.getCocina();

  return (
    <>
      <PageHeader
        title="Cocina"
        description="Seguimiento de platos en preparación. Asignate un plato y márcalo como listo cuando esté."
      />
      <CocinaView initial={comandas} />
    </>
  );
}
