import { test, expect } from "@playwright/test";

const routes = [
  // Módulos activos (conectados al backend)
  { href: "/dashboard", heading: "Dashboard", status: "ready" },
  { href: "/usuarios", heading: "Usuarios", status: "ready" },
  { href: "/roles", heading: "Roles", status: "ready" },
  { href: "/localidades", heading: "Localidades", status: "ready" },
  // Módulos WIP (datos mock)
  { href: "/carta", heading: "Carta", status: "wip" },
  { href: "/stock", heading: "Stock", status: "wip" },
  { href: "/mesas", heading: "Mesas", status: "wip" },
  { href: "/horarios", heading: "Horarios", status: "wip" },
  { href: "/pedidos", heading: "Pedidos delivery", status: "wip" },
  { href: "/cocina", heading: "Cocina", status: "wip" },
  { href: "/facturacion", heading: "Facturación", status: "wip" },
] as const;

for (const route of routes) {
  test(`${route.href} [${route.status}] carga con heading correcto`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(route.href);
    await expect(page).toHaveURL(new RegExp(route.href.slice(1)));
    await expect(
      page.getByRole("heading", { name: route.heading }),
    ).toBeVisible({ timeout: 8000 });

    // No debe mostrar mensaje de error de aplicación Next.js
    await expect(page.locator("text=Application error")).not.toBeVisible();
  });
}

test("el sidebar muestra todos los grupos de navegación", async ({ page }) => {
  await page.goto("/dashboard");
  // Los grupos del sidebar usan <p> con el texto exacto del grupo
  await expect(page.getByText("General", { exact: true })).toBeVisible();
  await expect(
    page.locator("nav p").filter({ hasText: "Administración" }).first(),
  ).toBeVisible();
  await expect(page.getByText("Operación", { exact: true })).toBeVisible();
});

test("el menú de usuario muestra el correo del admin", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText(/admin@aromas\.com/)).toBeVisible();
});

test("el logo o nombre del sistema es visible en el sidebar", async ({
  page,
}) => {
  await page.goto("/dashboard");
  // El sidebar debe mostrar el nombre del sistema
  await expect(page.getByText(/Aromas/i).first()).toBeVisible();
});
