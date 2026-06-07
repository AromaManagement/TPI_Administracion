# Aromas de Viña — Software de Administración

Panel web de administración del restaurante **Aromas de Viña** (Mendoza).
Construido con **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui**,
consume el backend [`TPI_Backend`](../TPI_Backend) (Express + Prisma + PostgreSQL).

## Arquitectura (MVC)

El proyecto separa responsabilidades siguiendo Modelo-Vista-Controlador,
adaptado al App Router de Next:

```
src/
├── models/          # MODELO  — tipos del dominio (espejo del schema Prisma)
├── services/        # acceso a datos — llamadas HTTP al backend (server-only)
├── controllers/     # CONTROLADOR — server actions: validan, orquestan, mapean errores
├── views/           # VISTA — componentes de página (formularios, tablas) por módulo
├── app/             # rutas del App Router (cada page.tsx compone una vista)
├── components/
│   ├── ui/          # componentes shadcn/ui
│   └── layout/      # sidebar, topbar, encabezados, avisos
├── lib/             # api client, sesión (cookies), validadores zod, navegación, formato
└── proxy.ts         # protección de rutas (auth) — convención de Next 16
```

**Flujo de una operación:** la _vista_ (cliente) invoca un _controller_ (server
action) → el controller valida con zod y llama a un _service_ → el service usa el
cliente HTTP (`lib/api.ts`) que adjunta el JWT desde la cookie httpOnly y pega
contra el backend. La respuesta vuelve como un `ActionResult` uniforme.

### Autenticación

- El login pega contra `POST /api/auth/login` del backend y guarda el JWT en una
  **cookie httpOnly** (`lib/session.ts`).
- `src/proxy.ts` protege todas las rutas del panel y redirige a `/login` sin sesión.
- Las llamadas al backend se hacen **del lado del servidor**, por eso la URL del
  backend usa `API_URL` (no `NEXT_PUBLIC_`).

## Módulos

| Módulo        | Estado | Backend                         |
| ------------- | ------ | ------------------------------- |
| Usuarios      | ✅      | `/api/users`                    |
| Roles         | ✅      | `/api/roles`                    |
| Localidades   | ✅      | `/api/localidades`              |
| Carta         | 🚧 WIP | pendiente (`/api/carta`)        |
| Stock         | 🚧 WIP | pendiente (`/api/articulos`)    |
| Mesas         | 🚧 WIP | pendiente (`/api/mesas`)        |
| Horarios      | 🚧 WIP | pendiente (`/api/horarios`)     |
| Pedidos       | 🚧 WIP | pendiente (`/api/comandas`)     |
| Cocina        | 🚧 WIP | pendiente (`/api/comandas`)     |
| Facturación   | 🚧 WIP | pendiente (`/api/facturas`)     |

Los módulos WIP ya tienen su vista construida y consumen datos mock desde
`src/services/wip.service.ts`. Para conectarlos, reemplazar el cuerpo de cada
service por la llamada real a `api.get(...)` cuando el endpoint exista.

## Puesta en marcha

1. Levantar el backend `TPI_Backend` (por defecto en `http://localhost:5000`).
2. Configurar las variables de entorno:

   ```bash
   cp .env.example .env.local
   # Ajustar API_URL si el backend no está en localhost:5000
   ```

3. Instalar dependencias y correr en desarrollo:

   ```bash
   npm install
   npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run start` — servir el build.
- `npm run lint` — ESLint.
