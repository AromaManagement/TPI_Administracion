import { PageHeader } from "@/components/layout/page-header";
import { cartaService } from "@/services/carta.service";
import { stockService } from "@/services/stock.service";
import { CartaView } from "@/views/carta/carta-view";

export default async function CartaPage() {
  const [carta, articulos] = await Promise.all([
    cartaService.getCarta(),
    stockService.getArticulos(),
  ]);

  return (
    <>
      <PageHeader
        title="Carta"
        description="Secciones y platos del menú del restaurante."
      />
      <CartaView carta={carta} articulos={articulos} />
    </>
  );
}
