import { test, expect } from "@playwright/test";

/**
 * Tests para el endpoint /api/direcciones con el nuevo soporte de lat/lng.
 * Usa el contexto request de Playwright para llamar al backend directamente
 * (TPI_Delivery es React Native, no testeable en browser).
 */

const API = "http://localhost:5001/api";

async function loginAdmin(request: import("@playwright/test").APIRequestContext) {
  const res = await request.post(`${API}/auth/login`, {
    data: { correo: "admin@aromas.com", contrasena: "12345678" },
  });
  const body = await res.json();
  return body.data.token as string;
}

// ---------------------------------------------------------------------------
// Crear dirección con coordenadas (flujo del mapa)
// ---------------------------------------------------------------------------

test("direccion: crear con lat/lng sin localidadId", async ({ request }) => {
  const token = await loginAdmin(request);

  const res = await request.post(`${API}/direcciones`, {
    data: {
      calle: "Av. San Martín",
      numeracion: "1200",
      barrio: "Centro",
      lat: -32.8907,
      lng: -68.8458,
      etiqueta: "Av. San Martín 1200, Centro, Mendoza",
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.lat).toBeCloseTo(-32.8907, 3);
  expect(body.data.lng).toBeCloseTo(-68.8458, 3);
  expect(body.data.etiqueta).toContain("San Martín");
  expect(body.data.localidadId).toBeNull();

  // Cleanup
  await request.delete(`${API}/direcciones/${body.data.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
});

// ---------------------------------------------------------------------------
// GET devuelve lat/lng
// ---------------------------------------------------------------------------

test("direccion: GET por id incluye lat/lng/etiqueta", async ({ request }) => {
  const token = await loginAdmin(request);

  const createRes = await request.post(`${API}/direcciones`, {
    data: {
      calle: "Belgrano",
      numeracion: "456",
      lat: -32.8943,
      lng: -68.8385,
      etiqueta: "Belgrano 456, Mendoza",
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data: created } = await createRes.json();

  const getRes = await request.get(`${API}/direcciones/${created.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(getRes.ok()).toBeTruthy();
  const { data } = await getRes.json();
  expect(data.lat).toBeCloseTo(-32.8943, 3);
  expect(data.lng).toBeCloseTo(-68.8385, 3);
  expect(data.etiqueta).toBe("Belgrano 456, Mendoza");

  // Cleanup
  await request.delete(`${API}/direcciones/${created.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
});

// ---------------------------------------------------------------------------
// Actualizar coordenadas (pin movido en el mapa)
// ---------------------------------------------------------------------------

test("direccion: PUT actualiza lat/lng", async ({ request }) => {
  const token = await loginAdmin(request);

  const createRes = await request.post(`${API}/direcciones`, {
    data: { calle: "Las Heras", numeracion: "789", lat: -32.88, lng: -68.84, etiqueta: "Las Heras 789" },
    headers: { Authorization: `Bearer ${token}` },
  });
  const { data: created } = await createRes.json();

  const updateRes = await request.put(`${API}/direcciones/${created.id}`, {
    data: { lat: -32.8950, lng: -68.8500, etiqueta: "Las Heras 789 (corregido)" },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(updateRes.ok()).toBeTruthy();
  const { data: updated } = await updateRes.json();
  expect(updated.lat).toBeCloseTo(-32.8950, 3);
  expect(updated.etiqueta).toContain("corregido");

  // Cleanup
  await request.delete(`${API}/direcciones/${created.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
});

// ---------------------------------------------------------------------------
// Crear dirección solo con texto (sin coordenadas — flujo legacy)
// ---------------------------------------------------------------------------

test("direccion: crear sin lat/lng sigue funcionando", async ({ request }) => {
  const token = await loginAdmin(request);

  // First create a localidad since it may be needed
  const locRes = await request.post(`${API}/localidades`, {
    data: { nombre: "Dir Test Localidad" },
    headers: { Authorization: `Bearer ${token}` },
  });
  const localidadId = locRes.ok() ? (await locRes.json()).data.id : null;

  const res = await request.post(`${API}/direcciones`, {
    data: {
      calle: "Rivadavia",
      numeracion: "999",
      barrio: "Godoy Cruz",
      ...(localidadId ? { localidadId } : {}),
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.ok()).toBeTruthy();
  const { data } = await res.json();
  expect(data.calle).toBe("Rivadavia");
  expect(data.lat).toBeNull();
  expect(data.lng).toBeNull();

  // Cleanup
  await request.delete(`${API}/direcciones/${data.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (localidadId) {
    await request.delete(`${API}/localidades/${localidadId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
});

// ---------------------------------------------------------------------------
// Validación: no falla con campos mínimos
// ---------------------------------------------------------------------------

test("direccion: crear con solo lat/lng (sin calle)", async ({ request }) => {
  const token = await loginAdmin(request);

  const res = await request.post(`${API}/direcciones`, {
    data: { lat: -32.891, lng: -68.843, etiqueta: "Ubicación seleccionada en mapa" },
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.ok()).toBeTruthy();
  const { data } = await res.json();
  expect(data.lat).toBeCloseTo(-32.891, 2);
  expect(data.calle).toBeNull();

  // Cleanup
  await request.delete(`${API}/direcciones/${data.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
});
