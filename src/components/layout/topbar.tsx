"use client";

import { useState } from "react";
import { Menu, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import type { SessionUser } from "@/lib/session";

/** Barra superior: botón de menú móvil + datos de usuario. */
export function Topbar({ user, hideNav = false }: { user: SessionUser; hideNav?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
      {!hideNav && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="lg:hidden" />}
          >
            <Menu className="size-5" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle className="flex items-center gap-2">
                <UtensilsCrossed className="text-primary size-5" />
                Aromas de Viña
              </SheetTitle>
            </SheetHeader>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1" />
      <UserMenu user={user} />
    </header>
  );
}
