# Orthopedic Hospital Management — Backend API

Node.js + Express + PostgreSQL backend for the Rajahmundry Orthopedic Hospital
management system. The schema and its design rationale live in
[`../docs/DATABASE_SCHEMA.md`](../docs/DATABASE_SCHEMA.md); this document
covers the API layer.

## Stack

- **Express 4** — HTTP layer
- **PostgreSQL** via `pg` — no ORM; raw parameterized SQL per module (see
  `src/modules/*/*.repository.js`)
- **zod** — request validation and env var validation
- **jsonwebtoken** + **bcryptjs** — stateless auth
- **pino** — structured logging
- **vitest** + **supertest** — integration tests against a real Postgres test DB

## Architecture

Each domain (patients, doctors, appointments, ...) lives under
`src/modules/<name>/` as a vertical slice:

```
<name>.routes.js       Express Router — wires auth/validation/handlers
<name>.controller.js   req/res orchestration only (thin)
<name>.service.js      business logic, activity logging, transactions
<name>.repository.js   raw parameterized SQL
<name>.schema.js        zod request schemas
<name>.serializer.js   DB row (snake_case) -> API response (camelCase)
```

Cross-cutting code lives in `src/config` (env, db pool), `src/middlewares`
(auth, validation, rate limiting, error handling), and `src/utils`.

### Design choices worth knowing about

- **No ORM.** The schema in `docs/schema.sql` already defines enums,
  sequences for display codes, and check constraints; a raw SQL layer keeps
  those visible instead of fighting an ORM's abstraction over them.
- **Server-computed totals.** Bill `subTotal`/`total` are always derived from
  submitted line items server-side, never trusted from the request body —
  see `bills.service.js`.
- **Soft delete / cancel, not physical delete.** Patients, doctors, and
  receptionists use `deleted_at`; appointments are cancelled (a status), never
  removed. This matches the schema's audit-trail design (see
  `DATABASE_SCHEMA.md` §1).
- **Transactions for multi-step writes.** Bed assign/release and bill+items
  creation use `withTransaction` (`src/config/db.js`) so partial writes can't
  leave inconsistent state.
- **JWT carries `name`/`role`.** Avoids a DB round-trip on every write just to
  log an activity's actor name. Trade-off: a display-name change via
  `PATCH /api/auth/profile` won't show up in newly-logged activities until the
  user's token is refreshed (re-login), since the old name is baked into the
  still-valid token.
- **Migrations are plain SQL files in `docs/`, applied in order.** `src/db/migrate.js`
  runs each file in its `MIGRATIONS` list and records it in a `schema_migrations`
  table so nothing re-runs. `schema.sql` is migration one; `0002_hospital_settings.sql`
  is the second. Add future changes as new numbered files and append them to
  both `MIGRATIONS` (in `migrate.js`) and the mirrored list in
  `tests/globalSetup.js`, rather than editing an already-applied file in place.

## Getting started

```bash
cd server
npm install
cp .env.example .env      # then edit DATABASE_URL / JWT_SECRET
npm run db:migrate         # applies docs/schema.sql
npm run db:seed            # optional: loads docs/seed.sql (dev data)
npm run dev                 # nodemon, reloads on change
```

Dev login after seeding: **username `admin`, password `Admin@123`** — rotate
this immediately in any environment beyond your own machine.

### macOS note: port 5000 conflict

The frontend's `src/services/api.js` defaults to `http://localhost:5000/api`,
so `.env.example` defaults `PORT` to `5000` to match. On macOS, Control
Center's AirPlay Receiver often already listens on port 5000. Either turn it
off (System Settings → General → AirDrop & Handoff → AirPlay Receiver) or set
a different `PORT` here and update `VITE_API_URL` in the frontend to match.

### Running tests

```bash
cp .env.test.example .env.test   # first time only; edit DATABASE_URL for your local Postgres role
npm test
```

This drops and recreates a separate `orthopedic_rajamundry_test` database
(connection string in `.env.test`) and applies `docs/schema.sql` +
`docs/seed.sql` to it before the suite runs (`tests/globalSetup.js`) — tests
run against real Postgres, not a mock. `.env.test` is gitignored (like `.env`)
since it hardcodes a local connection string — `.env.test.example` is the
committed template.

## Environment variables

See `.env.example` for the full list. All are validated at startup
(`src/config/env.js`) — the process exits immediately with a clear error if
something required is missing or malformed, rather than failing confusingly
later on first use.

## API conventions

- Base path: `/api`. Health check at `/health` (unauthenticated, unprefixed).
- All responses: `{ "success": true, "data": ..., "meta"?: {...} }` or
  `{ "success": false, "error": { "code", "message", "details"? } }`.
- Auth: `Authorization: Bearer <token>` from `POST /api/auth/login`.
- Pagination: `?page=1&limit=20` on list endpoints; response `meta` includes
  `{ page, limit, total, totalPages }`.
- IDs in URLs are UUIDs (the DB surrogate key). Human-readable display codes
  (`PT001246`, `DOC001`, `INV-2026-003`, ...) are returned as a separate
  `code` field, never used as the path identifier.

## Roles

`Super Admin`, `Admin`, `Receptionist`, `Doctor` (see `docs/schema.sql`
`roles` table). Route-level requirements are enforced by
`requireRole(...)` in each `*.routes.js` file — check there for the
authoritative per-endpoint requirement.

## Endpoint reference

### Auth (`/api/auth`)
| Method & path | Auth | Notes |
|---|---|---|
| `POST /login` | none (rate-limited) | `{ username, password }` → `{ token, user }` |
| `GET /me` | any | current user |
| `PATCH /profile` | any | `{ name?, email? }`, at least one required |
| `PATCH /password` | any (rate-limited) | `{ currentPassword, newPassword }`, `newPassword` min 8 chars |

### Patients (`/api/patients`)
| Method & path | Roles | Notes |
|---|---|---|
| `GET /` | any | `?page&limit&search` |
| `GET /:id` | any | |
| `POST /` | Super Admin, Admin, Receptionist | |
| `PUT /:id` | Super Admin, Admin, Receptionist | partial update |
| `DELETE /:id` | Super Admin, Admin | soft delete |

### Doctors (`/api/doctors`)
| Method & path | Roles | Notes |
|---|---|---|
| `GET /` | any | `?page&limit&search&status` |
| `GET /:id` | any | |
| `POST /` | Super Admin, Admin | |
| `PUT /:id` | Super Admin, Admin | partial update |
| `PATCH /:id/status` | Super Admin, Admin | toggles Active/Inactive |
| `DELETE /:id` | Super Admin, Admin | soft delete |

### Receptionists (`/api/receptionists`)
Same shape as doctors (minus specialization/experience/status-toggle),
all endpoints Super Admin/Admin only.

### Investigations (`/api/investigations`)
| Method & path | Roles | Notes |
|---|---|---|
| `GET /` | any | `?search&category&includeInactive` |
| `GET /:id` | any | |
| `POST /` | Super Admin, Admin | |
| `PUT /:id` | Super Admin, Admin | |
| `DELETE /:id` | Super Admin, Admin | deactivates (`is_active=false`), not a row delete |

### Wards (`/api/wards`) — read-only reference data
`GET /`, `GET /:id` — any authenticated role.

### Beds (`/api/beds`)
| Method & path | Roles | Notes |
|---|---|---|
| `GET /` | any | `?wardId&status` |
| `GET /:id` | any | |
| `GET /:id/admissions` | any | admission/discharge history |
| `POST /:id/assign` | Super Admin, Admin, Receptionist | `{ patientId }`; 409 if not `Available` |
| `POST /:id/release` | Super Admin, Admin, Receptionist | 409 if not `Occupied` |

### Appointments (`/api/appointments`)
| Method & path | Roles | Notes |
|---|---|---|
| `GET /` | any | `?patientId&doctorId&date&status` |
| `GET /:id` | any | |
| `POST /` | Super Admin, Admin, Receptionist | 409 on doctor double-booking |
| `PUT /:id` | Super Admin, Admin, Receptionist | partial update |
| `PATCH /:id/status` | + Doctor | `{ status }` |
| `DELETE /:id` | Super Admin, Admin, Receptionist | cancels (sets status), does not delete the row |

### Bills (`/api/bills`)
| Method & path | Roles | Notes |
|---|---|---|
| `GET /` | any | `?patientId&paymentStatus&billType` |
| `GET /:id` | any | includes `items[]` |
| `POST /` | Super Admin, Admin, Receptionist | `{ patientId, billType, items: [...], discount?, tax? }` — `subTotal`/`total` computed server-side |
| `PATCH /:id/status` | Super Admin, Admin, Receptionist | `{ paymentStatus, paymentMode? }` |

### Activities (`/api/activities`) — read-only audit/dashboard feed
`GET /?page&limit` — any authenticated role. Written internally by other
modules' services, never directly.

### Dashboard (`/api/dashboard`)
`GET /summary` — any authenticated role. Returns patient/doctor counts,
today's appointment count, bed occupancy breakdown, today's paid revenue,
pending bill count, and the 5 most recent activities. Not currently called by
the React admin dashboard, which computes the same figures client-side from
data it already has loaded — kept for other consumers (e.g. a lighter client)
and covered by its own tests.

### Hospital Settings (`/api/hospital-settings`)
| Method & path | Roles | Notes |
|---|---|---|
| `GET /` | any | singleton row — `{ name, address, contactPhone, licenseNumber, updatedAt }` |
| `PUT /` | Super Admin, Admin | partial update, at least one field required |

## Known limitations / next steps

- No refresh-token rotation — JWTs simply expire (`JWT_EXPIRES_IN`, default
  8h) and the user re-logs in. Fine for an internal hospital tool; revisit if
  this becomes internet-facing with longer sessions.
- No login provisioning UI for doctors/receptionists (`doctors.user_id` /
  `receptionists.user_id` exist in the schema but nothing populates them yet)
  — admins currently share the single seeded `Super Admin` account.
- No rate limiting per-user, only per-IP — fine behind a single hospital's
  NAT, worth revisiting for a multi-site deployment.
