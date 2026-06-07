import { PageHeader } from "@/components/layout/page-header";
import { stockService } from "@/services/stock.service";
import { StockView } from "@/views/stock/stock-view";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const articulos = await stockService.getArticulos();

  return (
    <>
      <PageHeader
        title="Stock"
        description="Artículos e ingredientes con su existencia actual. Registrá ingresos, egresos y ajustes."
      />
      <StockView initial={articulos} />
    </>
  );
}
