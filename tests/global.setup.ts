import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const authFile = join(__dirname, ".auth/state.json");

setup("autenticar como admin y guardar cookies", async ({ page }) => {
  mkdirSync(join(__dirname, ".auth"), { recursive: true });

  await page.goto("/login");
  await page.getByLabel("Correo").fill("admin@aromas.com");
  await page.getByLabel("Contraseña").fill("12345678");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
