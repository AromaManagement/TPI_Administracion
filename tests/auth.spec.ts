import { test, expect } from "@playwright/test";

async function loginAs(
  page: import("@playwright/test").Page,
  correo: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test.describe("Login", () => {
  test("login exitoso redirige al dashboard", async ({ page }) => {
    await loginAs(page, "admin@aromas.com", "admin123");
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("credenciales incorrectas muestran error y permanecen en login", async ({
    page,
  }) => {
    await loginAs(page, "intruso@aromas.com", "wrongpassword");
    await expect(page.locator("p.text-destructive")).toBeVisible({ timeout: 6000 });
    await expect(page).toHaveURL(/login/);
  });

  test("contraseña muy corta muestra error de validación", async ({ page }) => {
    await loginAs(page, "admin@aromas.com", "123");
    // Zod rechaza contraseñas < 6 chars antes de llamar al backend
    await expect(page.locator("p.text-destructive").first()).toBeVisible({
      timeout: 6000,
    });
    await expect(page).toHaveURL(/login/);
  });

  test("campo correo vacío no puede enviarse", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Contraseña").fill("admin123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    // El browser valida input[required] type="email" y bloquea el submit
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Protección de rutas", () => {
  test("acceso al dashboard sin autenticar redirige a login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("acceso a usuarios sin autenticar redirige a login", async ({ page }) => {
    await page.goto("/usuarios");
    await expect(page).toHaveURL(/login/);
  });

  test("acceso a roles sin autenticar redirige a login", async ({ page }) => {
    await page.goto("/roles");
    await expect(page).toHaveURL(/login/);
  });

  test("acceso a localidades sin autenticar redirige a login", async ({ page }) => {
    await page.goto("/localidades");
    await expect(page).toHaveURL(/login/);
  });

  test("acceso a rutas WIP sin autenticar redirige a login", async ({ page }) => {
    await page.goto("/carta");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Logout", () => {
  test("cerrar sesión redirige al login", async ({ page }) => {
    await loginAs(page, "admin@aromas.com", "admin123");
    await page.waitForURL("**/dashboard");

    await page.getByRole("button", { name: /admin@aromas/ }).click();
    await page.getByRole("menuitem", { name: /Cerrar sesión/ }).click();

    await expect(page).toHaveURL(/login/, { timeout: 6000 });
  });

  test("tras logout el dashboard vuelve a redirigir a login", async ({ page }) => {
    await loginAs(page, "admin@aromas.com", "admin123");
    await page.waitForURL("**/dashboard");

    await page.getByRole("button", { name: /admin@aromas/ }).click();
    await page.getByRole("menuitem", { name: /Cerrar sesión/ }).click();
    await expect(page).toHaveURL(/login/, { timeout: 6000 });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("tras logout la página de login muestra el formulario", async ({ page }) => {
    await loginAs(page, "admin@aromas.com", "admin123");
    await page.waitForURL("**/dashboard");

    await page.getByRole("button", { name: /admin@aromas/ }).click();
    await page.getByRole("menuitem", { name: /Cerrar sesión/ }).click();
    await expect(page).toHaveURL(/login/, { timeout: 6000 });

    await expect(page.getByLabel("Correo")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible();
  });
});
