import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const PSQL =
  "PGPASSWORD=aromas_pass /Applications/Postgres.app/Contents/Versions/latest/bin/psql -h localhost -p 5434 -U aromas_user -d aromas_db -t -c";

function psql(sql: string): string {
  return execSync(`${PSQL} "${sql}"`).toString().trim();
}

const ts = Date.now();
const correo = `pw.test.${ts}@aromas.com`;
const correoEditado = `pw.edit.${ts}@aromas.com`;

let testPersonaId: number;

test.describe.serial("Usuarios – CRUD completo", () => {
  test.beforeAll(async () => {
    // Crear una persona de prueba en la DB directamente (el panel no expone ABM de personas)
    const result = psql(
      `INSERT INTO persona (nombre, apellido, created_at, updated_at) VALUES ('Playwright', 'Test', NOW(), NOW()) RETURNING id;`,
    );
    testPersonaId = parseInt(result, 10);
    if (!testPersonaId || isNaN(testPersonaId)) {
      throw new Error(`No se pudo crear la persona de prueba. Output: ${result}`);
    }
  });

  test.afterAll(async () => {
    // Limpiar la persona de prueba (el usuario habrá sido eliminado en el test de delete)
    try {
      psql(`DELETE FROM persona WHERE id = ${testPersonaId};`);
    } catch {
      // Si no existe, ignorar
    }
  });

  test("crea un nuevo usuario", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();

    await page.getByRole("button", { name: "Nuevo usuario" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nuevo usuario" }),
    ).toBeVisible();

    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña").fill("test1234");

    // Seleccionar el primer rol disponible
    const select = page.locator("select#rolId");
    const firstOption = select.locator("option:not([disabled])").first();
    const rolValue = await firstOption.getAttribute("value");
    await select.selectOption({ value: rolValue! });

    await page.getByLabel("ID de persona").fill(String(testPersonaId));

    await page.getByRole("button", { name: "Crear usuario" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("cell", { name: correo })).toBeVisible({
      timeout: 8000,
    });
  });

  test("el usuario creado aparece en la tabla con su rol", async ({ page }) => {
    await page.goto("/usuarios");
    const row = page.locator("tr").filter({ hasText: correo });
    await expect(row).toBeVisible({ timeout: 8000 });
    // Debe mostrar un badge con el nombre del rol
    await expect(row.locator("td").nth(2)).not.toBeEmpty();
  });

  test("edita el correo del usuario", async ({ page }) => {
    await page.goto("/usuarios");

    const row = page.locator("tr").filter({ hasText: correo });
    await expect(row).toBeVisible({ timeout: 8000 });

    await row.locator("button").first().click(); // Pencil (editar)
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Editar usuario" }),
    ).toBeVisible();

    const correoInput = page.getByLabel("Correo");
    await correoInput.clear();
    await correoInput.fill(correoEditado);

    // Contraseña vacía = no cambiar
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("cell", { name: correoEditado })).toBeVisible({
      timeout: 8000,
    });
    await expect(
      page.locator("tr").filter({ hasText: correo }).filter({ hasNotText: correoEditado }),
    ).not.toBeVisible();
  });

  test("elimina el usuario editado", async ({ page }) => {
    await page.goto("/usuarios");

    const row = page.locator("tr").filter({ hasText: correoEditado });
    await expect(row).toBeVisible({ timeout: 8000 });

    page.on("dialog", (dialog) => dialog.accept());
    await row.locator("button").last().click(); // Trash2 (eliminar)

    await expect(
      page.locator("tr").filter({ hasText: correoEditado }),
    ).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe("Usuarios – validaciones", () => {
  test("correo duplicado muestra error", async ({ page }) => {
    await page.goto("/usuarios");

    await page.getByRole("button", { name: "Nuevo usuario" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Correo").fill("admin@aromas.com"); // ya existe
    await page.getByLabel("Contraseña").fill("admin123");

    const select = page.locator("select#rolId");
    const firstOption = select.locator("option:not([disabled])").first();
    await select.selectOption({ value: (await firstOption.getAttribute("value"))! });

    await page.getByLabel("ID de persona").fill("9999"); // persona inexistente
    await page.getByRole("button", { name: "Crear usuario" }).click();

    // Debe aparecer un error (correo duplicado o FK de personaId)
    await expect(
      page.locator("p.text-destructive, [data-sonner-toast]").first(),
    ).toBeVisible({ timeout: 6000 });
  });

  test("cancelar con Escape no guarda datos", async ({ page }) => {
    await page.goto("/usuarios");

    await page.getByRole("button", { name: "Nuevo usuario" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Correo").fill("cancelado@test.com");
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.locator("tr").filter({ hasText: "cancelado@test.com" }),
    ).not.toBeVisible();
  });

  test("correo con formato inválido muestra validación", async ({ page }) => {
    await page.goto("/usuarios");

    await page.getByRole("button", { name: "Nuevo usuario" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Correo").fill("no-es-un-correo");
    await page.getByLabel("Contraseña").fill("password123");
    await page.getByRole("button", { name: "Crear usuario" }).click();

    // Zod o el browser HTML5 rechazan el email inválido
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
