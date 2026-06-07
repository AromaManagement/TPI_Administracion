import { Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WipNotice } from "@/components/layout/wip-notice";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pedidoService } from "@/services/wip.service";
import { ESTADOS_PLATO } from "@/models";
import { formatDateTime } from "@/lib/format";

export default async function CocinaPage() {
  const comandas = await pedidoService.getCocina();

  return (
    <>
      <PageHeader
        title="Cocina"
        description="Platos solicitados y su estado. Estados: SIN_ASIGNAR, ASIGNADO, EN_COCINA, ENTREGADO."
      />
      <WipNotice endpoint="/api/comandas (cocina)" />

      <div className="mb-6 flex flex-wrap gap-2">
        {ESTADOS_PLATO.map((estado) => (
          <Badge key={estado} variant="outline">
            {estado}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {comandas.map((comanda) => (
          <Card key={comanda.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Comanda #{comanda.id}
                <Badge variant="secondary">
                  {comanda.estadoComanda ?? "SIN_ASIGNAR"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Solicitada: {formatDateTime(comanda.fechaSolicitud)}
              </p>
              <p>
                {comanda.detalles?.length
                  ? `${comanda.detalles.length} plato(s)`
                  : "Detalle de platos pendiente de backend."}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
