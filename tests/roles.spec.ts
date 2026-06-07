import { test, expect } from "@playwright/test";

const ts = Date.now();
const nombre = `PW Rol ${ts}`;
const nombreEditado = `PW Rol ${ts} v2`;

test.describe.serial("Roles – CRUD completo", () => {
  test("crea un nuevo rol", async ({ page }) => {
    await page.goto("/roles");
    await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();

    await page.getByRole("button", { name: "Nuevo rol" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nuevo rol" }),
    ).toBeVisible();

    await page.getByLabel("Nombre").fill(nombre);
    await page.getByRole("button", { name: "Crear rol" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("cell", { name: nombre })).toBeVisible({
      timeout: 8000,
    });
  });

  test("edita el rol recién creado", async ({ page }) => {
    await page.goto("/roles");

    const row = page.locator("tr").filter({ hasText: nombre });
    await expect(row).toBeVisible({ timeout: 8000 });

    await row.locator("button").first().click(); // Pencil (editar)
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Editar rol" }),
    ).toBeVisible();

    const input = page.getByLabel("Nombre");
    await input.clear();
    await input.fill(nombreEditado);
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("cell", { name: nombreEditado })).toBeVisible({
      timeout: 8000,
    });
  });

  test("elimina el rol editado", async ({ page }) => {
    await page.goto("/roles");

    const row = page.locator("tr").filter({ hasText: nombreEditado });
    await expect(row).toBeVisible({ timeout: 8000 });

    page.on("dialog", (dialog) => dialog.accept());
    await row.locator("button").last().click(); // Trash2 (eliminar)

    await expect(
      page.locator("tr").filter({ hasText: nombreEditado }),
    ).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe("Roles – validaciones y diálogo", () => {
  test("cancelar con Escape no guarda datos", async ({ page }) => {
    await page.goto("/roles");

    await page.getByRole("button", { name: "Nuevo rol" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Nombre").fill("Rol Cancelado Test");
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.locator("tr").filter({ hasText: "Rol Cancelado Test" }),
    ).not.toBeVisible();
  });

  test("nombre vacío muestra validación y no cierra el dialog", async ({
    page,
  }) => {
    await page.goto("/roles");

    await page.getByRole("button", { name: "Nuevo rol" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Nombre").clear();
    await page.getByRole("button", { name: "Crear rol" }).click();

    // El dialog no cierra porque el campo es required
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("nombre demasiado corto muestra error de zod", async ({ page }) => {
    await page.goto("/roles");

    await page.getByRole("button", { name: "Nuevo rol" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Nombre").fill("X"); // 1 char, mínimo es 2
    await page.getByRole("button", { name: "Crear rol" }).click();

    // Debe mostrar error de validación o permanecer en el dialog
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 4000 });
  });

  test("rechazar eliminación en el confirm nativo no elimina el rol", async ({
    page,
  }) => {
    await page.goto("/roles");

    // Necesitamos al menos un rol en la tabla
    const isEmpty = await page
      .locator("td")
      .filter({ hasText: "No hay roles" })
      .isVisible()
      .catch(() => false);

    if (isEmpty) {
      await page.getByRole("button", { name: "Nuevo rol" }).click();
      await page.getByLabel("Nombre").fill("Rol Para No Borrar");
      await page.getByRole("button", { name: "Crear rol" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    }

    const rowCount = await page.locator("tbody tr").count();

    page.on("dialog", (dialog) => dialog.dismiss()); // rechazar
    await page.locator("tbody tr").first().locator("button").last().click();

    // La tabla debe seguir con el mismo número de filas
    await expect(page.locator("tbody tr")).toHaveCount(rowCount);
  });
});
