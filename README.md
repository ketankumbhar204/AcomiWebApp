# CountIn Web

React web client for CountIn. Consumes the **same Spring Boot APIs** as the React Native mobile app (`K:\CountIn`). The mobile app is the product source of truth; this repo is the desktop presentation layer.

Backend: `K:\Projects\CountIn\Backend\countin-backend` (unchanged, shared).

---

## Tech stack

| Concern | Library |
|---------|---------|
| UI | React 19, Vite, TypeScript |
| Components | MUI (Material UI) |
| Routing | React Router |
| Server state | TanStack Query |
| Client state | Zustand |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Dates | Day.js |
| Toasts | Notistack |

---

## Prerequisites

- Node.js 22+ (recommended)
- Running CountIn backend on `http://localhost:8080` (for API calls later)

---

## Setup

```bash
cd K:\CountInWeb
npm install
cp .env.example .env   # if needed
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

---

## Folder structure

```
src/
  app/                 # App shell — providers, router, root App
    providers/
    router/
  layouts/             # AuthLayout, AppLayout, BlankLayout
  modules/             # Feature modules (empty until implemented)
  shared/
    api/               # Axios client, unwrap helpers, ApiError
    components/        # ErrorBoundary, LoadingBoundary, NotFoundPage
    constants/
    hooks/             # Shared hooks (auth session reader only)
    layouts/           # Re-exports root layouts
    theme/             # CountIn MUI theme + tokens
    types/             # API / auth contracts
    utils/
    assets/
    config/            # env
  store/               # Zustand root + auth session shell
  styles/
  routes/              # Path constants
```

Path alias: `@/*` → `src/*`

---

## Architecture decisions

1. **Feature-based modules** — each business domain lives under `src/modules/<name>/` when implemented.
2. **Layout + shared components before Auth** — prove desktop chrome first; Auth validates the data stack next.
3. **Shared desktop library** — modules reuse `PageHeader`, `DataTable`, `EmptyState`, etc. (no per-module forks).
4. **Same API contract as mobile** — `ApiResponse<T>`, Bearer JWT, base URL `/api/v1`.
5. **Auth reuses mobile contracts** — OTP flow, DTOs, validation, errors; only layout adapts for desktop.
6. **ProtectedRoute exists but is not wired** to `/` until the auth module registers `/login`.

### Implementation order

```
Foundation (done)
  → Layout foundation + shared desktop components (done)
  → Authentication (done) — see docs/authentication.md
  → Dashboard   ← next business module
  → Members → Accommodation → Occupancy → Meals
  → Payments → Complaints → Inventory → Settings → Reports
```

See `K:\CountIn\docs\web\implementation-roadmap.md`, [`docs/page-template.md`](./docs/page-template.md), and [`docs/authentication.md`](./docs/authentication.md).

---

## How modules will be added

1. Create `src/modules/<name>/` with `pages/`, `components/`, `hooks/`, optional `workflows/`, and `index.ts`.
2. Compose pages with the **standard page template** (`docs/page-template.md`) using shared components only.
3. Add API functions under the module (or shared API) — reuse mobile contracts.
4. Register routes in `src/app/router/routes.tsx` and path constants in `src/routes/paths.ts`.
5. Inject sidebar nav via `AppLayout` `navSections` from the shell router.
6. Port permissions/validation from mobile `src/utils` — do not reinvent rules.

Suggested first modules (when ready): **Authentication** → Spaces shell → Dashboard.

---

## Coding standards

- TypeScript **strict**; prefer `import type` for type-only imports.
- Absolute imports via `@/…`.
- No business logic in layout/providers.
- No mock/fake APIs or demo module pages.
- Match mobile i18n keys when copy is added later.
- Format with Prettier; lint with ESLint before PR.

---

## Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API root including `/api/v1` | `http://localhost:8080/api/v1` |
| `VITE_API_TIMEOUT_MS` | Axios timeout | `30000` |
| `VITE_APP_ENV` | `development` \| `staging` \| `production` | `development` |

---

## Manual configuration notes

1. **CORS** — the Spring Boot backend currently has no CORS configuration. Browser calls from `localhost:5173` will fail until the backend adds allowed origins (or you use a Vite proxy). Prefer enabling CORS on the shared backend for local web + future production web origins.
2. **JWT** — same `Authorization: Bearer` header as mobile.
3. **Fonts** — Plus Jakarta Sans loaded via Google Fonts in `src/styles/global.css` (swap to self-hosted if required).

---

## Related docs

Mobile web blueprint (reference only): `K:\CountIn\docs\web\`
