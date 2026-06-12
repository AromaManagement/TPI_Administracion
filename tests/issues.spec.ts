import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Botón de refresh en pedidos y cocina
// ---------------------------------------------------------------------------

test("pedidos: tiene botón de actualizar", async ({ page }) => {
  await page.goto("/pedidos");
  await expect(page.getByRole("heading", { name: "Pedidos delivery" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Actualizar/ })).toBeVisible();
});

test("pedidos: el botón actualizar funciona sin error", async ({ page }) => {
  await page.goto("/pedidos");
  await expect(page.getByRole("heading", { name: "Pedidos delivery" })).toBeVisible();

  await page.getByRole("button", { name: /Actualizar/ }).click();
  // Debe mostrar "Actualizando…" brevemente y volver a "Actualizar"
  await expect(page.getByRole("button", { name: /Actualizar/ })).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Application error")).not.toBeVisible();
});

test("cocina: tiene botón de actualizar", async ({ page }) => {
  await page.goto("/cocina");
  await expect(page.getByRole("heading", { name: "Cocina" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Actualizar/ })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Issue 3: Admin no puede despachar — solo ver estado
// ---------------------------------------------------------------------------

test("pedidos: no existe botón Despachar en la vista admin", async ({ page }) => {
  await page.goto("/pedidos");
  await expect(page.getByRole("heading", { name: "Pedidos delivery" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Despachar/i })).not.toBeVisible();
});

test("pedidos: pedidos LISTO muestran texto de espera en lugar de botón Despachar", async ({ page }) => {
  await page.goto("/pedidos");
  await expect(page.getByRole("heading", { name: "Pedidos delivery" })).toBeVisible();

  // Si hay pedidos en "Listos para despacho", verificar que no tengan botón Despachar
  const listoSection = page.locator("section").filter({ hasText: "Listos para despacho" });
  const cards = listoSection.locator('[class*="Card"], [data-testid]').all();
  const count = await listoSection.getByRole("button", { name: /Despachar/i }).count();
  expect(count).toBe(0);

  // El texto de espera debe existir si hay pedidos (o la sección debe estar vacía)
  const sinPedidos = listoSection.getByText("Sin pedidos");
  const esperandoTexto = listoSection.getByText(/repartidor/i);
  const haySinPedidos = await sinPedidos.isVisible();
  const hayEsperando = await esperandoTexto.count() > 0;
  expect(haySinPedidos || hayEsperando).toBe(true);
});
