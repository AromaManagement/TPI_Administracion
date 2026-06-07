import { PageHeader } from "@/components/layout/page-header";
import { WipNotice } from "@/components/layout/wip-notice";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cartaService } from "@/services/wip.service";
import { formatCurrency } from "@/lib/format";

export default async function CartaPage() {
  const carta = await cartaService.getActiva();

  return (
    <>
      <PageHeader
        title="Carta"
        description="Secciones y productos de la carta del restaurante."
      />
      <WipNotice endpoint="/api/carta" />

      <div className="grid gap-4 md:grid-cols-2">
        {carta.secciones?.map((seccion) => (
          <Card key={seccion.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {seccion.nombre}
                <Badge variant="outline">
                  {seccion.platos?.length ?? 0} productos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {seccion.platos && seccion.platos.length > 0 ? (
                seccion.platos.map((plato) => (
                  <div
                    key={plato.id}
                    className="flex items-start justify-between gap-4 border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{plato.nombre}</p>
                      {plato.detalle && (
                        <p className="text-muted-foreground text-xs">
                          {plato.detalle}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {formatCurrency(plato.precio)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Sin productos en esta sección.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
