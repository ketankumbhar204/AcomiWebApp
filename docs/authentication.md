# Authentication (Acomi Web)

See also the blueprint doc: `K:\AmicoMobile\docs\web\authentication.md`.

## Routes

| Path | Access | Page |
|------|--------|------|
| `/login` | Guest | Mobile number + password |
| `/register` | Guest | Name, mobile number, password, confirm password |
| `/register/otp`, `/register/password`, `/otp` | Redirect to `/register` | Reserved OTP register paths; page files kept for future OTP |
| `/` | Protected | Authenticated shell + logout |
| `/unauthorized` | Public | Session expired |
| `/privacy` | Public | Privacy policy |
| `/delete-account` | Public | Password-verified account deletion |

## Local backend

1. Start Spring Boot on `http://localhost:8080`
2. `npm run dev` — Vite proxies `/api` → backend (see `vite.config.ts`)
3. Password register/login against `POST /api/v1/auth/register` and `POST /api/v1/auth/login`. OTP endpoints remain on the backend for future use and are not linked from the current UI. There is no Forgot Password flow yet; future OTP can support reset.

## Module layout

`src/modules/auth/` — api, components, hooks, pages, schemas
