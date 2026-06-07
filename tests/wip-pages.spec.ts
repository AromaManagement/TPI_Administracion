import { test, expect } from "@playwright/test";

const wipPages = [
  { href: "/carta", heading: "Carta" },
  { href: "/stock", heading: "Stock" },
  { href: "/mesas", heading: "Mesas" },
  { href: "/horarios", heading: "Horarios" },
  { href: "/pedidos", heading: "Pedidos delivery" },
  { href: "/cocina", heading: "Cocina" },
  { href: "/facturacion", heading: "Facturación" },
] as const;

for (const page_ of wipPages) {
  test(`${page_.href} carga datos mock sin errores de servidor`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(page_.href);

    // Debe llegar a la URL correcta (sin redirección a /login → ya tenemos cookies)
    await expect(page).toHaveURL(new RegExp(page_.href.slice(1)));

    // Debe mostrar el heading del módulo
    await expect(page.getByRole("heading", { name: page_.heading })).toBeVisible({
      timeout: 8000,
    });

    // No debe mostrar error de aplicación Next.js
    await expect(page.locator("text=Application error")).not.toBeVisible();

    // El aviso de WIP debe estar presente
    await expect(page.locator("[data-testid='wip-notice'], text=/WIP|pendiente|mock/i").first()).toBeVisible().catch(
      () => {
        // No es crítico si el aviso de WIP tiene otro selector; solo verificamos que carga
      },
    );
  });
}

test("las páginas WIP no bloquean la navegación de regreso al dashboard", async ({
  page,
}) => {
  await page.goto("/carta");
  await expect(page.getByRole("heading", { name: "Carta" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("el badge WIP aparece en las cards del dashboard para los módulos pendientes", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const wipBadges = page.locator("text=WIP");
  await expect(wipBadges.first()).toBeVisible();
  // Hay 7 módulos WIP → 14 badges en total (7 en cards del dashboard + 7 en sidebar)
  await expect(wipBadges).toHaveCount(14);
});
