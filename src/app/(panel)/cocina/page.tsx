import { PageHeader } from "@/components/layout/page-header";
import { AutoRefresh } from "@/components/ui/auto-refresh";
import { cocinaService } from "@/services/cocina.service";
import { usuarioService } from "@/services/usuario.service";
import { CocinaView } from "@/views/cocina/cocina-view";

export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  const [comandas, cocineros] = await Promise.all([
    cocinaService.getCocina(),
    usuarioService.getByRol("COCINERO"),
  ]);

  return (
    <>
      <PageHeader
        title="Cocina"
        description="Seguimiento de platos en preparación. Asigná un cocinero a cada plato y marcalo como listo cuando esté."
      >
        <AutoRefresh />
      </PageHeader>
      <CocinaView initial={comandas} cocineros={cocineros} />
    </>
  );
}
