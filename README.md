# bunext-sqlite

A preset for [bunext](https://github.com/moduletrace/bunext) running [bun-sqlite](https://github.com/moduletrace/bun-sqlite) as the database management system. Use this as the starting point for new full-stack Bun projects: filesystem routing, SQLite with generated types, password login, an admin CRUD API, WebSockets, cron, audit logging, and email all wired up out of the box.

## Stack

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Runtime   | Bun (never npm/npx - use `bun`)                    |
| Framework | `@moduletrace/bunext` (filesystem routing, SSR)    |
| Database  | `@moduletrace/bun-sqlite` (schema + generated types) |
| UI        | Tailwind CSS v4 + `twui` component library         |
| Icons     | `lucide-react`                                     |
| Validation| `zod` (v4)                                         |
| Email     | `nodemailer` (React-rendered templates)            |

## Requirements

- Bun >= 1.3
- No database server required - `bun-sqlite` manages a local SQLite file at `db/<db_name>` (`db/bsqlite` by default).

## Local Development

1. `cp .env.example .env` (if present) or create `.env` with `ENCRYPTION_KEY`/`ENCRYPTION_SALT` values.
2. `bun install`
3. `bun run db:schema` - creates tables and regenerates `db/types/db.ts`.
4. `bun run dev` - starts the dev server (default port `7227`).
5. Open the app. With no accounts yet, every page sends you to `/auth/signup` to create the super admin (user #1). That is the only time signup is shown.

Headless alternative to step 5: `SEED_SUPER_ADMIN_PASSWORD=... bun run seed` creates the super admin from the CLI (default `super.admin@example.com`, override with `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_USERNAME`, `SEED_SUPER_ADMIN_FIRST_NAME`, `SEED_SUPER_ADMIN_LAST_NAME`).

Log in at `/auth/login` with your email or username and password.

## Available Scripts

| Purpose                       | Command                            |
| ----------------------------- | ---------------------------------- |
| Dev server                    | `bun run dev`                      |
| Production                    | `bun run start`                    |
| Type-check only               | `bun run typecheck`                |
| Run tests                     | `bun run test`                     |
| Run a single test             | `bun test <path/to/file.test.ts>`  |
| Regenerate favicon/brand      | `bun run gen:favicon`              |
| DB schema (tables)            | `bun run db:schema`                |
| DB admin UI                   | `bun run db:admin`                 |
| DB backup                     | `bun run db:backup`                |
| Seed super admin user         | `bun run seed`                     |
| Query DB (CLI)                | `bun llm-code-assistant/query-db.ts "<sql>"` |
| Deploy to production          | `./deploy/deploy-prod.sh`          |

## App Structure

| Directory                      | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `db/schema.ts`                 | SQLite schema - the source of truth for `db/types/db.ts`      |
| `src/server.ts`                | Entrypoint: `bunextInit()`, `Bun.serve` (media, `/ws` auth'd upgrade), cron startup |
| `src/pages/`                   | Filesystem routes (`__root.server.ts` auth guard, `__root.tsx` layout/context) |
| `src/pages/api/`               | API routes - incl. the CRUD catch-all at `api/admin/crud/[[...paths]].ts` |
| `src/websocket/`               | WebSocket handler: upgrade-time auth, room system, event dispatch |
| `src/cron/`                    | Cron tasks - `Bun.cron` schedules, folder-per-task |
| `@moduletrace/twui`            | The `twui` component library (external package, shared across projects) |
| `src/components/general/`      | Shared page components built on twui                          |
| `src/functions/backend/`       | Server-only logic: auth, DB queries, email, PDF generation, media, logger |
| `src/functions/frontend/`      | Client-safe: CRUD/fetch handlers, media upload helpers, document actions  |
| `src/hooks/`                   | Shared React hooks (`use-admin-crud-get`, `use-form-init`, ...) |
| `src/schemas/`                 | zod request schemas for public/auth endpoints                 |
| `src/utils/`                   | Utility modules: cookies, crypt, safe-compare, ejson, money   |
| `src/utils/rbac/`              | RBAC engine: pass-through users + declarative assignment matrix |
| `src/dict/`                    | Dictionaries: user types (+ assignment matrices), media types, document statuses, websocket rooms, log categories |
| `src/data/`                    | Static data: `site-data.ts` (brand literals), `app-data.ts` (constants) |
| `src/scripts/`                 | CLI scripts: brand asset generator, seed                      |
| `llm-code-assistant/`          | `query-db.ts` - read-only SQL CLI for coding assistants       |

## Architecture

### Auth

- **Auth guard:** `src/pages/__root.server.ts` - runs per request. There are no public pages: anything outside `/admin` and `/auth` redirects to `/admin`. With no accounts, everything redirects to `/auth/signup`; once one exists, signup redirects away. `/admin/*` requires login; `/auth/*` redirects logged-in users.
- **Session:** encrypted cookie (`AES-256-GCM`, PBKDF2-derived key) + a matching CSRF cookie, verified constant-time on every request (`src/functions/backend/auth/user-auth.ts`). 60-day expiry.
- **Login:** email or username plus password (`api/auth/password-login.ts`), no email step. Set/change password at `/admin/settings/change-password`. Google login (`api/auth/google-login.ts`) works for existing accounts only when `GOOGLE_CLIENT_ID` is set; it never creates accounts.
- **Signup:** first-run only (`api/auth/signup.tsx`): creates the super admin with a password and logs them in. Refused once any user exists.
- **RBAC:** `src/utils/rbac/` - `super_admin` passes everything; other grants/revocations are governed by `UserTypeAssignmentMatrix`/`UserTypeDeletionMatrix` in `src/dict/user-types-dict.ts`.
- **Audit trail:** every auth event (signup, login, failure, logout) is written to the `logs` table via `src/functions/backend/logger.ts`.

### Admin CRUD API

`api/admin/crud/[[...paths]].ts` dispatches `GET/POST/PUT/DELETE` by table name. Tables without a custom handler fall through to generic CRUD (super admin only). Customize a table by adding a folder under `src/pages/api/admin/crud/(tables)/<table>/` with per-method authorization.

### Documents (Letters / Emails / Invoices / Quotes)

A complete document suite ships on top of the generic CRUD: `letters`, `emails`, `email_attachments`, `invoices`, `invoice_items`, `quotes`, `quote_items`, `invoice_quotes` tables with admin sections at `/admin/{letters,emails,invoices,quotes}`. Invoices and quotes get auto-generated numbers (from `SiteData["SiteSlug"]`), sortable line items, quote-to-invoice linking, branded PDF generation (`src/functions/backend/pdf/`), and sending via React-rendered HTML email (`src/functions/backend/email/`, shell in `src/email/root.tsx`). See `AGENTS.md` for the full map.

### Backups

Super admins can create, list, download, and restore database snapshots from `/admin/backups` (`src/functions/backend/backups/`, API under `api/admin/backups/`). Backups are written to `db/.backups`; restore accepts a listed snapshot or an uploaded SQLite file. Every action is audit-logged.

### Settings

`/admin/settings` redirects to `/admin/settings/general` (theme: System, Light or Dark, saved per device). `/admin/settings/profile` is the current user's profile (editable by every logged-in user, including `read_only`). `/admin/settings/change-password` sets or changes the user's own password. The sub pages are listed in the rail (`src/dict/settings-pages-dict.ts`).

### WebSockets

`/ws` upgrades only after `userAuth` succeeds; the user session is frozen into the socket. Rooms are declared in `src/dict/websocket-rooms.ts` and managed by the dual-index store in `src/websocket/(data)/rooms.ts`. Client events dispatch through `src/websocket/(functions)/handle-message.ts`; add per-event handlers as `src/websocket/client-requests/<event>/index.ts`. The twui `useWebSocket` hook is the client counterpart.

### Cron

`src/cron/index.ts` registers tasks (gated to the `MAIN_SERVER` container in production). Each task is a folder with a default-exported async function scheduled with `Bun.cron` through `registerCronJob` (`src/cron/register-cron-job.ts`), which logs before each run and catches errors. Schedules are interpreted in UTC. The bundled heartbeat task doubles as a DB-liveness probe.

## UI Conventions

- Build with `twui` components (`Section`, `Container`, `Row`, `Stack`, `Card`, `Button`, ...) and `src/components/general/` - never raw HTML for layout.
- Themable tokens live only in `src/styles/main.css` (`@theme inline`). No hardcoded hex colors or radii in components.
- Brand name/slug live only in `src/data/site-data.ts`; the logo mark only in `public/logos/logo.svg`.

## Page Directory Rules

Route-local code under `src/pages` uses non-routed meta folders: `(sections)`, `(partials)`, `(data)`, `(functions)`, `(utils)`, `(hooks)`. Keep route files thin. Dynamic routes use `[param]`; catch-alls use `[[...paths]]`. Server functions live in `index.server.ts` beside `index.tsx`.

## Verification

`bun run typecheck` and `bun run test` are the verification steps (no linter/formatter configured). CI runs both on every push and pull request (`.github/workflows/ci.yml`). Unit tests are colocated `*.test.ts` files run individually with `bun test <file>`.

## Maintainer Notes

- `.env` and `secrets/` are gitignored. Never commit them.
- Don't patch `@moduletrace/twui` in `node_modules` - it is a shared publishable library. Appearance overrides belong in `src/styles/main.css`.