# Authentication (Acomi Web)

See also the blueprint doc: `K:\AmicoMobile\docs\web\authentication.md`.

## Routes

| Path | Access | Page |
|------|--------|------|
| `/login` | Guest | Login + send OTP |
| `/otp` | Guest (requires `location.state.mobileNumber`) | Verify OTP |
| `/` | Protected | Authenticated shell + logout |
| `/unauthorized` | Public | Session expired |
| `/forbidden` | Public | Access denied |

## Local backend

1. Start Spring Boot on `http://localhost:8080`
2. `npm run dev` — Vite proxies `/api` → backend (see `vite.config.ts`)
3. MVP OTP from backend config: **111111**

## Module layout

`src/modules/auth/` — api, components, hooks, pages, schemas
