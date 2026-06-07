import Link from "next/link";
import { redirect } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar fijo en desktop */}
      <aside className="bg-background hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <UtensilsCrossed className="text-primary size-5" />
          <Link href="/dashboard" className="font-semibold">
            Aromas de Viña
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
