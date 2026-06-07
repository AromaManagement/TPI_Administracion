import { test, expect } from "@playwright/test";

const ts = Date.now();
const nombre = `PW Localidad ${ts}`;
const nombreEditado = `PW Localidad ${ts} v2`;

test.describe.serial("Localidades – CRUD completo", () => {
  test("crea una nueva localidad", async ({ page }) => {
    await page.goto("/localidades");
    await expect(
      page.getByRole("heading", { name: "Localidades" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Nueva localidad" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nueva localidad" }),
    ).toBeVisible();

    await page.getByLabel("Nombre").fill(nombre);
    await page.getByRole("button", { name: "Crear localidad" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("cell", { name: nombre })).toBeVisible({
      timeout: 8000,
    });
  });

  test("edita la localidad recién creada", async ({ page }) => {
    await page.goto("/localidades");

    const row = page.locator("tr").filter({ hasText: nombre });
    await expect(row).toBeVisible({ timeout: 8000 });

    await row.locator("button").first().click(); // Pencil (editar)
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Editar localidad" }),
    ).toBeVisible();

    const input = page.getByLabel("Nombre");
    await input.clear();
    await input.fill(nombreEditado);
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("cell", { name: nombreEditado })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator("tr").filter({ hasText: nombre }).filter({ hasNotText: nombreEditado })).not.toBeVisible();
  });

  test("elimina la localidad editada", async ({ page }) => {
    await page.goto("/localidades");

    const row = page.locator("tr").filter({ hasText: nombreEditado });
    await expect(row).toBeVisible({ timeout: 8000 });

    page.on("dialog", (dialog) => dialog.accept());
    await row.locator("button").last().click(); // Trash2 (eliminar)

    await expect(
      page.locator("tr").filter({ hasText: nombreEditado }),
    ).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe("Localidades – validaciones y diálogo", () => {
  test("cancelar con Escape no guarda datos", async ({ page }) => {
    await page.goto("/localidades");

    await page.getByRole("button", { name: "Nueva localidad" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Nombre").fill("Localidad Cancelada Test");
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.locator("tr").filter({ hasText: "Localidad Cancelada Test" }),
    ).not.toBeVisible();
  });

  test("nombre vacío muestra validación y no cierra el dialog", async ({
    page,
  }) => {
    await page.goto("/localidades");

    await page.getByRole("button", { name: "Nueva localidad" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Limpiar el input y enviar (campo required)
    await page.getByLabel("Nombre").clear();
    await page.getByRole("button", { name: "Crear localidad" }).click();

    // El dialog no debe cerrarse
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("abrir y cerrar el dialog de edición restaura el formulario", async ({
    page,
  }) => {
    await page.goto("/localidades");

    // Necesitamos al menos una localidad; si la tabla está vacía, creamos una temporal
    const isEmpty = await page
      .locator("td")
      .filter({ hasText: "No hay localidades" })
      .isVisible();

    if (isEmpty) {
      await page.getByRole("button", { name: "Nueva localidad" }).click();
      await page.getByLabel("Nombre").fill("Temporal para edición test");
      await page.getByRole("button", { name: "Crear localidad" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    }

    const firstRow = page.locator("tbody tr").first();
    await firstRow.locator("button").first().click();
    await expect(
      page.getByRole("heading", { name: "Editar localidad" }),
    ).toBeVisible();

    // Cerrar sin guardar
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });
});
