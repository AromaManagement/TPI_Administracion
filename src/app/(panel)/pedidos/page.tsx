import { PageHeader } from "@/components/layout/page-header";
import { pedidosService } from "@/services/pedidos.service";
import { PedidosView } from "@/views/pedidos/pedidos-view";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const pedidos = await pedidosService.getPedidos();

  return (
    <>
      <PageHeader
        title="Pedidos delivery"
        description="Pedidos listos en cocina pendientes de despacho. Avanzá el estado de cada recorrido."
      />
      <PedidosView initial={pedidos} />
    </>
  );
}
