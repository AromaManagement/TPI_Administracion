import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WipNotice } from "@/components/layout/wip-notice";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pedidoService } from "@/services/wip.service";
import { formatDateTime } from "@/lib/format";

export default async function PedidosPage() {
  const pedidos = await pedidoService.getDelivery();

  return (
    <>
      <PageHeader
        title="Pedidos delivery"
        description="Pedidos realizados por la app. Administración gestiona los estados."
      />
      <WipNotice endpoint="/api/comandas?tipo=aplicacion" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pedidos.map((pedido) => {
          const cliente = pedido.cliente?.usuario;
          const dir = pedido.comandaAplicacion?.direccion;
          return (
            <Card key={pedido.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Pedido #{pedido.id}
                  </CardTitle>
                  <Badge variant="secondary">
                    {pedido.estadoComanda ?? "—"}
                  </Badge>
                </div>
                <CardDescription>
                  {cliente
                    ? `${cliente.nombre} ${cliente.apellido}`
                    : "Cliente desconocido"}{" "}
                  · {formatDateTime(pedido.fechaSolicitud)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dir ? (
                  <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {dir.calle} {dir.numeracion}
                      {dir.casaDepto ? `, ${dir.casaDepto}` : ""}
                      {dir.barrio ? ` — ${dir.barrio}` : ""}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Sin dirección de entrega.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
