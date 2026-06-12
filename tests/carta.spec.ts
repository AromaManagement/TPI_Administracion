import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goCarta(page: Page) {
  await page.goto("/carta");
  await expect(page.getByRole("heading", { name: "Carta" })).toBeVisible();
}

/** Devuelve el div de header de una sección (contiene los botones editar/eliminar). */
function headerSeccion(page: Page, nombre: string) {
  // h3 → div.flex.items-center → div.min-w-0 → div.flex.justify-between (header con botones)
  return page.locator("h3", { hasText: nombre }).locator("..").locator("..").locator("..");
}

/** Devuelve la card completa de una sección (contiene todo, incluyendo "Agregar plato"). */
function cardSeccion(page: Page, nombre: string) {
  return page.locator("h3", { hasText: nombre }).locator("../../../..");
}

async function crearSeccion(page: Page, nombre: string, detalle?: string) {
  await page.getByRole("button", { name: "Nueva sección" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre").fill(nombre);
  if (detalle) await dialog.getByLabel(/Descripción/).fill(detalle);
  await dialog.getByRole("button", { name: "Crear sección" }).click();
  await expect(page.getByText("Sección creada correctamente.")).toBeVisible({ timeout: 5000 });
}

async function eliminarSeccion(page: Page, nombre: string) {
  page.once("dialog", (d) => d.accept()); // registrar ANTES del click
  await headerSeccion(page, nombre).getByRole("button").last().click();
}

async function crearPlato(page: Page, opts: { seccionNombre: string; nombre: string; precio: string; detalle?: string }) {
  await cardSeccion(page, opts.seccionNombre).getByRole("button", { name: "Agregar plato" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre").fill(opts.nombre);
  await dialog.getByLabel(/Precio/).fill(opts.precio);
  if (opts.detalle) await dialog.getByLabel(/Descripción/).fill(opts.detalle);
  await dialog.getByRole("button", { name: "Agregar plato" }).click();
  await expect(page.getByText("Plato creado correctamente.")).toBeVisible({ timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("carta: página carga sin errores con DB vacía", async ({ page }) => {
  await goCarta(page);
  await expect(page.getByRole("button", { name: "Nueva sección" })).toBeVisible();
  await expect(page.locator("text=Application error")).not.toBeVisible();
  await expect(page.getByText("Todavía no hay secciones")).toBeVisible();
});

test("carta: crear una sección", async ({ page }) => {
  await goCarta(page);
  await crearSeccion(page, "Entradas Test", "Para comenzar");
  await expect(page.locator("h3", { hasText: "Entradas Test" })).toBeVisible();

  // Cleanup
  await eliminarSeccion(page, "Entradas Test");
  await expect(page.getByText("Sección eliminada.")).toBeVisible({ timeout: 5000 });
});

test("carta: crear sección y agregar un plato", async ({ page }) => {
  await goCarta(page);
  await crearSeccion(page, "Principales Test");
  await crearPlato(page, {
    seccionNombre: "Principales Test",
    nombre: "Milanesa napolitana",
    precio: "1500",
    detalle: "Con papas fritas",
  });
  await expect(page.getByText("Milanesa napolitana")).toBeVisible();
  await expect(page.getByText("$ 1.500,00")).toBeVisible();

  // Cleanup
  await eliminarSeccion(page, "Principales Test");
  await expect(page.getByText("Sección eliminada.")).toBeVisible({ timeout: 5000 });
});

test("carta: editar una sección", async ({ page }) => {
  await goCarta(page);
  await crearSeccion(page, "Bebidas Test");

  await headerSeccion(page, "Bebidas Test").getByRole("button").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nombre").fill("Bebidas y Vinos");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Sección actualizada correctamente.")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("h3", { hasText: "Bebidas y Vinos" })).toBeVisible();

  // Cleanup
  await eliminarSeccion(page, "Bebidas y Vinos");
  await expect(page.getByText("Sección eliminada.")).toBeVisible({ timeout: 5000 });
});

test("carta: eliminar una sección", async ({ page }) => {
  await goCarta(page);
  await crearSeccion(page, "Postres Test");

  await eliminarSeccion(page, "Postres Test");
  await expect(page.getByText("Sección eliminada.")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("h3", { hasText: "Postres Test" })).not.toBeVisible();
});

test("carta: editar un plato", async ({ page }) => {
  await goCarta(page);
  await crearSeccion(page, "Edit Plato Sec");
  await crearPlato(page, {
    seccionNombre: "Edit Plato Sec",
    nombre: "Plato original",
    precio: "1000",
  });

  const platoItem = page.locator("div.group").filter({ hasText: /Plato original/ }).first();
  await platoItem.hover();
  await platoItem.getByRole("button").first().click({ force: true });

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre").fill("Plato editado");
  await dialog.getByLabel(/Precio/).fill("2000");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Plato actualizado correctamente.")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Plato editado")).toBeVisible();

  // Cleanup
  await eliminarSeccion(page, "Edit Plato Sec");
  await expect(page.getByText("Sección eliminada.")).toBeVisible({ timeout: 5000 });
});

test("carta: eliminar un plato", async ({ page }) => {
  await goCarta(page);
  await crearSeccion(page, "Del Plato Sec");
  await crearPlato(page, {
    seccionNombre: "Del Plato Sec",
    nombre: "Plato a eliminar",
    precio: "500",
  });

  page.once("dialog", (d) => d.accept()); // registrar ANTES del click
  const platoItem = page.locator("div.group").filter({ hasText: /Plato a eliminar/ }).first();
  await platoItem.hover();
  await platoItem.getByRole("button").last().click({ force: true });
  await expect(page.getByText("Plato eliminado.")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Plato a eliminar")).not.toBeVisible();

  // Cleanup
  await eliminarSeccion(page, "Del Plato Sec");
  await expect(page.getByText("Sección eliminada.")).toBeVisible({ timeout: 5000 });
});

test("carta: no permite crear sección con nombre vacío", async ({ page }) => {
  await goCarta(page);
  await page.getByRole("button", { name: "Nueva sección" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Crear sección" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
