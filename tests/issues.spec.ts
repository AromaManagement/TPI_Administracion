import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Issue 1: Borrar localidad con AlertDialog
// ---------------------------------------------------------------------------

test("localidades: el botón eliminar abre un AlertDialog de confirmación", async ({ page }) => {
  await page.goto("/localidades");
  await expect(page.getByRole("heading", { name: "Localidades" })).toBeVisible();

  // Crear una localidad de prueba primero
  await page.getByRole("button", { name: "Nueva localidad" }).click();
  await page.getByLabel("Nombre").fill("Localidad Test Borrar");
  await page.getByRole("button", { name: "Crear localidad" }).click();
  await expect(page.getByText("Localidad creada correctamente")).toBeVisible();

  // Hacer click en el botón de borrar (Trash2)
  const row = page.getByRole("row", { name: /Localidad Test Borrar/ });
  await expect(row).toBeVisible();
  await row.getByRole("button").last().click();

  // Debe aparecer el AlertDialog
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByText("¿Eliminar localidad?")).toBeVisible();
  await expect(page.getByText("Esta acción no se puede deshacer. Se eliminará la localidad permanentemente.")).toBeVisible();

  // Confirmar eliminación
  await page.getByRole("button", { name: "Eliminar" }).click();

  // La fila debe desaparecer
  await expect(row).not.toBeVisible();
});

test("localidades: cancelar el AlertDialog no elimina la localidad", async ({ page }) => {
  await page.goto("/localidades");
  await expect(page.getByRole("heading", { name: "Localidades" })).toBeVisible();

  // Tomar la primera localidad de la tabla
  const firstRow = page.getByRole("row").nth(1);
  const nombre = await firstRow.getByRole("cell").nth(1).textContent();

  // Click en borrar
  await firstRow.getByRole("button").last().click();
  await expect(page.getByRole("alertdialog")).toBeVisible();

  // Cancelar
  await page.getByRole("button", { name: "Cancelar" }).click();

  // El dialog debe cerrarse y la localidad sigue ahí
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
  if (nombre) await expect(page.getByText(nombre)).toBeVisible();
});

// ---------------------------------------------------------------------------
// Issue 2: Botón de refresh en pedidos y cocina
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
