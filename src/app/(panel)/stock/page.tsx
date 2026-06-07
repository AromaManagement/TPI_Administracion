import { PageHeader } from "@/components/layout/page-header";
import { WipNotice } from "@/components/layout/wip-notice";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stockService } from "@/services/wip.service";

export default async function StockPage() {
  const articulos = await stockService.getArticulos();

  return (
    <>
      <PageHeader
        title="Stock"
        description="Artículos individuales e ingredientes con su existencia actual."
      />
      <WipNotice endpoint="/api/articulos" />

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Existencia</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articulos.map((articulo) => {
              const cantidad = articulo.stock?.cantidad ?? 0;
              const minimo = articulo.stock?.minimo ?? 0;
              const bajo = minimo > 0 && cantidad <= minimo;
              return (
                <TableRow key={articulo.id}>
                  <TableCell className="font-medium">{articulo.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={articulo.esIngrediente ? "outline" : "secondary"}>
                      {articulo.esIngrediente ? "Ingrediente" : "Producto"}
                    </Badge>
                  </TableCell>
                  <TableCell>{articulo.unidadMedida ?? "—"}</TableCell>
                  <TableCell className="text-right">{cantidad}</TableCell>
                  <TableCell className="text-right">{minimo || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={bajo ? "destructive" : "secondary"}>
                      {bajo ? "Bajo" : "OK"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
