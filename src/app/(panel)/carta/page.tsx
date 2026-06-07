import { PageHeader } from "@/components/layout/page-header";
import { cartaService } from "@/services/carta.service";
import { CartaView } from "@/views/carta/carta-view";

export default async function CartaPage() {
  const carta = await cartaService.getCarta();

  return (
    <>
      <PageHeader
        title="Carta"
        description="Secciones y platos del menú del restaurante."
      />
      <CartaView carta={carta} />
    </>
  );
}
