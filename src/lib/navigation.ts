import {
  LayoutDashboard,
  Users,
  MapPin,
  UtensilsCrossed,
  Boxes,
  Truck,
  ChefHat,
  type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "ready" | "wip";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  status: ModuleStatus;
  group: "General" | "Administración" | "Operación";
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Resumen general del sistema.",
    status: "ready",
    group: "General",
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    icon: Users,
    description: "ABM de administradores y cocineros.",
    status: "ready",
    group: "Administración",
  },
  {
    title: "Localidades",
    href: "/localidades",
    icon: MapPin,
    description: "Localidades para direcciones de entrega.",
    status: "ready",
    group: "Administración",
  },
  {
    title: "Carta",
    href: "/carta",
    icon: UtensilsCrossed,
    description: "Secciones, platos y precios de la carta.",
    status: "ready",
    group: "Administración",
  },
  {
    title: "Stock",
    href: "/stock",
    icon: Boxes,
    description: "Artículos, ingredientes y movimientos de stock.",
    status: "wip",
    group: "Administración",
  },
  {
    title: "Pedidos delivery",
    href: "/pedidos",
    icon: Truck,
    description: "Seguimiento de pedidos de la app de delivery.",
    status: "wip",
    group: "Operación",
  },
  {
    title: "Cocina",
    href: "/cocina",
    icon: ChefHat,
    description: "Estado de los platos en preparación.",
    status: "ready",
    group: "Operación",
  },
];

export const NAV_GROUPS = ["General", "Administración", "Operación"] as const;
