import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/lib/navigation";

export default function DashboardPage() {
  const modules = NAV_ITEMS.filter((i) => i.href !== "/dashboard");

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Bienvenido al panel de administración de Aromas de Viña."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                      <Icon className="size-5" />
                    </div>
                    {item.status === "wip" ? (
                      <Badge variant="outline">WIP</Badge>
                    ) : (
                      <Badge variant="secondary">Activo</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 flex items-center gap-1">
                    {item.title}
                    <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
