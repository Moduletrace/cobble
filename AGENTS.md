# Agent Instructions

## Stack

- **Runtime:** Bun - not Node. Use `bun` commands, never `npm`/`npx`.
- **Framework:** `@moduletrace/bunext` - not Next.js. Routing is filesystem-based under `src/pages/`, served by `Bun.serve` in `src/server.ts`.
- **Database:** `@moduletrace/bun-sqlite` - SQLite database. Schema in `db/schema.ts`, generated types in `db/types/db.ts`. Config in `bun-sqlite.config.ts`.
- **UI:** Tailwind CSS v4 + the `@moduletrace/twui` component library (installed package) + shared components in `src/components/general/`. There is **no** shadcn/ui, no `tailwind.config`, and no `components.json` - twui is the only component system. CSS chain: `src/pages/__root.tsx` imports `src/styles/main.css`, which imports `@moduletrace/twui/base.css` (`@import "tailwindcss"`). Theme tokens (colors/radius/fonts) are overridden via the `@theme inline` block in `src/styles/main.css`.
- **Icons:** `lucide-react`.
- **Validation:** `zod` v4 (`zod@4.1.12`).
- **Branding:** Site name/slug live only in `src/data/site-data.ts`. Logo source of truth is `public/logos/logo.svg` (rendered inline by `src/components/general/logo-icon.tsx`); browser favicon/assets are generated from it.

## Entrypoint

`src/server.ts` - runs `bunextInit()`, starts `Bun.serve`, then starts cron:

- `/media/*` short-circuits to the media server handler
- `/ws` upgrades only after `userAuth` succeeds (session frozen into the socket at upgrade time); the `websocket` handler object lives in `src/websocket/`
- everything else goes to `bunext.bunextRequestHandler`
- `cron()` starts after the server is up; in production it is gated to the `MAIN_SERVER` container

## Commands

| Purpose                          | Command                                                   |
| -------------------------------- | --------------------------------------------------------- |
| Dev server                       | `bun run dev` (runs `bun src/server.ts`)                  |
| Production                       | `bun run start` (`NODE_ENV=production bun src/server.ts`) |
| Type-check only                  | `bun run typecheck`                                       |
| Run tests                        | `bun run test`                                            |
| Regenerate favicon/brand assets  | `bun run gen:favicon` (runs `src/scripts/generate-brand-assets.ts`) |
| DB schema (tables)               | `bun run db:schema`                                       |
| DB admin UI                      | `bun run db:admin`                                        |
| DB backup                        | `bun run db:backup`                                       |
| Seed super admin user            | `bun run seed` (runs `src/scripts/seed-super-admin.tsx`)  |
| Query DB (CLI)                   | `bun llm-code-assistant/query-db.ts "<sql>"`              |
| Install                          | `bun install`                                             |

No linter or formatter configured. `bun run typecheck` and `bun run test` are the verification steps. Tests are colocated `.test.ts`/`.test.tsx` files - run one with `bun test <file>`.

## Querying the Database

Inspect live data with `bun llm-code-assistant/query-db.ts "<sql>"` - a read-only SQL CLI that loads the schema from `db/schema.ts` automatically and prints a normalized JSON envelope (`success`, `payload`, `count`, `insert_return`, `error`, `msg`). Exit code `1` on failure. Use it instead of fishing through ORM code when you need to know what's actually in the database.

## Path Alias

`@/*` resolves from repo root. Import like `@moduletrace/twui/layout/Button`, `@/src/components/general/logo`, `@/src/data/site-data`, `@/db/types/db`.

## Architecture

### Auth

- **Auth guard:** `src/pages/__root.server.ts` - server function that runs on every request.
    - Redirects unauthenticated `/admin/*` → `/auth/login`
    - Already-authenticated users hitting `/auth/*` (except paths containing `/logout`) are redirected to `/admin`
- **Session:** encrypted auth cookie (AES-256-GCM, PBKDF2-derived key from `ENCRYPTION_KEY`/`ENCRYPTION_SALT`) plus a CSRF cookie. `userAuth` (`src/functions/backend/auth/user-auth.ts`) decrypts, checks expiry (`AuthExpiryDays`, 60) against the embedded `date`, verifies the CSRF cookie against the token embedded in the session (constant-time, `src/utils/safe-compare.ts`), and re-reads `user_types` from the DB every request (revoked users lose access immediately).
- **Login:** SSO codes (`sso_login_codes` table, 15-min expiry, `randomInt`-generated) via `api/auth/get-login-code.tsx` + `api/auth/login.ts`. Codes are bound to the `user_id` in the encrypted SSO cookie, compared with `safeCompare`, and deleted after `SSOMaxCodeAttempts` failures. `get-login-code` returns the same response for unknown users (no enumeration). Google OAuth is available via `api/auth/google-login.ts` (creates the account when called with `google_signup` from the signup page). Sessions are issued by `src/functions/backend/auth/login-user.ts` (supports `reauth` for silent refresh without audit logging).
- **Login method (site-wide, `AUTH_LOGIN_METHOD`):** `code` (default; passwordless, emailed code only via `get-login-code`) or `password` (`api/auth/password-login.ts`, then the emailed code as a second step). Parsed by `src/utils/parse-login-method.ts` (anything but `password` means `code`), read server-side with `grabLoginMethod()` and client-side with `useLoginMethod()` (from `envs.AUTH_LOGIN_METHOD`). Each mode's endpoints refuse requests in the other mode. The SSO cookie records the issuing `method`; `verifySSOCode` (`src/functions/backend/auth/verify-sso-code.ts`) only accepts codes whose method matches, so login takes the site method and password reset takes `reset`. Password mode adds `/auth/reset-password` (+ `/confirm`) via `api/auth/request-password-reset.ts` / `api/auth/reset-password.ts`, a required password at signup, and set/change password in `/admin/settings/password`. bcrypt hashes live in the separate `user_passwords` table (never in `users`; blocked from the CRUD API via `src/dict/private-tables.ts`). `api/auth/resend-login-code.ts` resends from the SSO cookie.
- **Auth layout:** `/auth/*` (except `/auth/logout`) renders in `src/layouts/auth/` with no site header/footer.
- **RBAC:** `src/utils/check-user-access.ts` (includes/excludes primitive, `super_admin` bypass) plus the declarative engine in `src/utils/rbac/` - `userTypeAssignment` interprets `UserTypeAssignmentMatrix`/`UserTypeDeletionMatrix` in `src/dict/user-types-dict.ts`. `read_only` users are blocked from non-GET CRUD in the router.
- **Audit trail:** `src/functions/backend/logger.ts` - `logEvent`/`logError` write to the `logs` table. Login, SSO, Google login, logout, cron runs, and WebSocket connects are all logged.

### WebSocket

- Upgrades on `/ws` with `userAuth` validation (401 if not logged in); `WebSocketSession` (`src/websocket/types.ts`) carries `{ user, user_types }`.
- Rooms declared in `src/dict/websocket-rooms.ts` -> typed `WebsocketRoomType`. Store in `src/websocket/(data)/rooms.ts`: `WeakMap` for per-client metadata, `Map<room, Set<ws>>` for lookups, empty rooms deleted. Join/leave/broadcast in `src/websocket/(functions)/`.
- Message dispatch in `handle-message.ts`: `client:ping` → `server:pong`, unknown events → `error`. The twui `useWebSocket` hook sends a raw `"twui::ping"` keepalive string - non-JSON messages are ignored.
- Client handlers: `src/websocket/client-requests/<event>/index.ts` (folder-per-event), replying through `wsSendData`.

### Cron

`src/cron/index.ts` is the single registration point called from `server.ts`. Tasks live in one folder each (`src/cron/<name>/index.ts`) as default-exported async functions, scheduled with in-process `Bun.cron` via `registerCronJob({ title, schedule, task, run_on_start })` (`src/cron/register-cron-job.ts`), which logs before each run and catches/logs errors. Schedules are cron expressions or nicknames (`@hourly`) interpreted in UTC; runs never overlap. Gated in production by `MAIN_SERVER`. The bundled `heartbeat` task doubles as a DB-liveness probe.

### Admin CRUD API

`api/admin/crud/[[...paths]].ts` dispatches `GET/POST/PUT/DELETE` by table name: `userAuth` → `read_only` GET-only gate → per-table switch → generic fallback (super admin only). Tables without custom handlers fall through to generic CRUD with zero code. Customize a table by adding `src/pages/api/admin/crud/(tables)/<table>/` with `index.ts` + per-method files, then add a `case` in the router.

### Documents (Letters / Emails / Invoices / Quotes)

The preset ships a complete document suite on top of the generic CRUD:

- **Tables:** `letters`, `emails`, `email_attachments`, `invoices`, `invoice_items`, `quotes`, `quote_items`, `invoice_quotes` (statuses/enums in `src/dict/document-dict.ts`)
- **Admin sections:** `/admin/letters`, `/admin/emails`, `/admin/invoices`, `/admin/quotes` - full list/create/view/edit CRUD, line items, quote-to-invoice linking, PDF download, send-email modals
- **PDF:** `src/functions/backend/pdf/` - `pdf-helpers.ts`, `letter-pdf.ts`, `invoice-pdf.ts` (drives both invoices and quotes via `kind`), `render-blocks.ts` + `html-blocks.ts` (TinyMCE HTML → PDF blocks), `letter-date.ts`
- **Email:** `src/functions/backend/email/` - `email-client.ts` (nodemailer SMTP), `send-email.tsx` (renders ReactNode into the `src/email/root.tsx` shell), `document-emails.tsx` (invoice/quote bodies)
- **API routes:** `api/admin/{letters,invoices,quotes}/generate-pdf.ts` (streams PDF binary), `api/admin/{emails,invoices,quotes}/send-email.tsx`, `api/admin/emails/sync-attachments.ts`
- **DB grabs:** `db/documents/`, `db/invoices/grab-invoice.ts`, `db/quotes/grab-quote.ts`
- **Client helpers:** `src/functions/frontend/document-actions.ts` (PDF download + send-email actions)
- **Numbering:** invoice/quote numbers auto-generate as `<SLUG>-YYYYMM-###` / `<SLUG>Q-YYYYMM-###` from `SiteData["SiteSlug"]` in the `invoices`/`quotes` CRUD handlers
- **Shared UI:** `src/components/general/` `pdf-preview.tsx`, `sortable-line-items-editor.tsx` (+ `sortable-line-item-row.tsx`), `copy-from-existing-select.tsx`, `main-hero-section.tsx`

## Admin Route Hierarchy

Actual preset routes under `/admin`:

- `/admin` - dashboard
- `/admin/people` - admin users list, plus `create/`, `[user_id]/` (profile), `[user_id]/edit/`
- `/admin/letters` - letter templates, plus `create/`, `[id]/`, `[id]/edit/`
- `/admin/emails` - email records/drafts, plus `create/`, `[id]/`, `[id]/edit/`, `template/` (live email-shell preview)
- `/admin/invoices` - invoices, plus `create/`, `[id]/`, `[id]/edit/`
- `/admin/quotes` - quotes, plus `create/`, `[id]/`, `[id]/edit/`
- `/admin/backups` - super admin only: create/list/download database snapshots in `db/.backups`, plus `restore/` (restore a listed backup, or upload a SQLite database file which is saved to `.backups` then restored). Shells out to the `bun-sqlite` CLI (`backup`, and `import <file>` since `restore` is interactive) via `src/functions/backend/backups/`; API routes in `api/admin/backups/`
- `/admin/settings` - current user profile, plus `password/` (only when `AUTH_LOGIN_METHOD=password`; redirects to `/admin/settings` otherwise). The aside renders it as a collapsible sub-nav via `children` in `(dict)/admin-aside-groups-dict.tsx`

Admin sidebar data in `src/layouts/admin/(partials)/admin-aside-links-dict.tsx`; aside chrome in `(partials)/admin-aside.tsx`. Page heroes use the shared `AdminHero` component (`src/components/general/admin-hero.tsx`).

## Page Directory Rules

For route-local code under `src/pages`, use non-routed meta folders:

- `(sections)` - page sections
- `(partials)` - components used by sections
- `(data)` - page-local data
- `(functions)` - page-local functions
- `(utils)` - page-local utilities
- `(hooks)` - page-local hooks

Keep route files (e.g. `index.tsx`) thin - compose from route-local meta folders.

Dynamic routes use `[param]` syntax (e.g. `[id]`, `[user_type]`, `[key]`). Catch-all routes use `[[...paths]]`.

Server functions use `index.server.ts` alongside `index.tsx` (e.g. `single-document/[id]/index.server.ts`).

## Shared Code Organization

- **`src/hooks/`** - Shared React hooks: `use-admin-crud-get`, `use-fetch-get`, `use-form-init`, `use-local-user`, `use-users-get`
- **`src/functions/`** - Shared functions split by target:
    - `src/functions/backend/` - Server-only: auth (`backend/auth/`), DB queries (`backend/db/` incl. `documents/`, `invoices/`, `quotes/`), email client + templates (`email/`), PDF generation (`pdf/`), media upload, `logger.ts` (audit logging)
    - `src/functions/frontend/` - Client-safe: CRUD handlers, fetch handlers, media upload/delete handlers, `document-actions.ts` (PDF download/send actions)
    - `src/functions/server/` - Server utilities (media server handler etc.)
- **`src/utils/`** - Utility modules: cookies, crypt, ejson, money, safe-compare, text-to-html, and more. Most have corresponding `.test.ts` files.
- **`src/utils/rbac/`** - RBAC engine: `user-type-assignment` (matrix interpreter), `is-pass-through-user`, `can-*` permission helpers, `filter-assignable-user-types` - with `bun:test` suites driven by fixture matrices
- **`src/dict/`** - Dictionaries/constants: main links (`main-links-dict.ts`), user types + assignment matrices, media types, document statuses (`document-dict.ts`), websocket rooms, log categories, company data
- **`src/data/`** - Static data: `site-data.ts` (site name/slug - the only place brand literals live), `app-data.ts` (app constants - cookie names, limits, defaults, Paystack endpoint)
- **`src/types/`** - Type definitions: `index.ts` (incl. WebSocket event/room types), `sql-joins.ts`, `paystack.ts`, `search-api.ts`
- **`src/scripts/`** - CLI scripts: `seed-super-admin.tsx` (idempotent super admin seed) + `generate-brand-assets.ts` (favicon/brand asset generator)
- **`llm-code-assistant/`** - `query-db.ts` (read-only SQL CLI for coding assistants)

## Component Systems

| Directory                    | Description                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@moduletrace/twui`          | **The** design system - external package. Contains layout primitives, elements, editors (TinyMCE), form components, hooks, SVGs, and utilities. Import from `@moduletrace/twui` or a deep path such as `@moduletrace/twui/layout/Button` |
| `src/components/general/`    | Shared page components built on twui: `logo`, `logo-icon`, `inner-page-hero-section`, `main-hero-section`, `admin-hero`, `login-shell`, `tagline-section`, `pdf-preview`, `sortable-line-items-editor`, `copy-from-existing-select`, media/image helpers |

## UI & Styling Rules (MANDATORY)

- **Always build UI with the twui component library and the shared `src/components/general/` components.** Do not hand-roll HTML for layout, typography, or controls.
  - Layout: `Section`, `Container`, `Stack`, `Row`, `Center`, `Span`, `P`, `H1`-`H5`, `Button`, `Divider`, `Img`, `Link`, `ArrowedLink`, `Main`, `Header`, `Footer`, `Spacer`
  - Elements: `Card`, `Paper`, `Tag`, `HeaderNav` (+ `MainLinks` dict), `LinkList`, `Tabs`, `Table`, `Breadcrumbs`, `Modal`, `Dropdown`, `CheckBulletPoints`, `EmptyContent`, `Loading`, `LoadingBlock`, `Toggle`, `Toast`
  - Forms: `Form`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radios`, `SearchSelect`, `FileUpload`, `ImageUpload`
  - Shared: `Logo`, `LogoIcon`, `InnerPageHeroSection`, `AdminHero`, `LoginShell` (auth pages/forms), `TaglineSection`
- **UNCHANGEABLE RULE - twui components always win over raw JSX elements.** Use twui components (`H1`-`H5`, `P`, `Span`, `List`, `Img`, `Row`, `Stack`, `Container`, `Section`, `Card`, `Button`, `Tag`, `Link`, etc.) before basic JSX elements (`<h1>`-`<h6>`, `<p>`, `<span>`, `<ul>`, `<li>`, `<img>`, `<a>`, `<button>`, `<div>`-as-card, etc.). Never introduce or reintroduce a raw JSX element where a twui equivalent exists. Override twui defaults via `className` rather than reaching for the raw element.
- **Never create new CSS classes, CSS files, or inline `style={{...}}` hacks.** Style exclusively by composing existing component props/classNames, existing twui classNames (`twui-*`), semantic theme-token utilities (`bg-dark`, `bg-light`, `text-dark`, `text-primary`, `bg-primary`, `text-accent`, `bg-accent`, `text-secondary`, `border-slate-200`, etc.), and utility classes already used elsewhere in this codebase. Build up from what exists; extend component code only when the existing API cannot express the need.
- **Theming:** colors, radii, and fonts change only in two places: the `@theme inline` block in `src/styles/main.css` (overrides `@moduletrace/twui/base.css` defaults). Never hardcode hex colors, radii, or font stacks inside components.
- **Branding:** `public/logos/logo.svg` is the single source of truth for the logo mark; `logo-icon.tsx` renders it inline and `logo.tsx` renders the wordmark from `SiteData["SiteName"]`. Whenever the logo changes, run `bun run gen:favicon` to regenerate `public/favicon.ico`, `public/favicon.png`, `public/apple-touch-icon.png`, and `public/logos/logo.png` (the last is embedded in generated PDFs). Font + favicon links live in `__root.tsx` `Head()`.
- **Site name:** brand literals live only in `src/data/site-data.ts`. Page meta titles, emails, and UI copy must interpolate `SiteData["SiteName"]` - never hardcode a brand name in page files.

## Conventions

- Prefer one function/component per file over monolithic files with multiple exports.
- **Modularization is non-negotiable: prioritize modularization over monolithic functions/components.** Repeated UI blocks must be extracted into their own reusable components driven by props (e.g. an info row component taking `{ icon, text }`), never repeated inline markup.
- **Every rendered array must have a separate component for each array item.** Always extract the item JSX into its own component and render it via `items.map((item) => <ItemComponent {...item} />)` - never inline the item's JSX inside the map callback.
- **No em dashes (U+2014) anywhere** in the repo: code, comments, docs, markdown, or user-facing strings. Use a regular hyphen (`-`) or restructure the sentence instead.
- Always use object parameters (`{ foo, bar }`) instead of comma-separated positional parameters.
- Prefer existing patterns over new abstractions.
- **Do not patch `@moduletrace/twui`** - it is a general, publishable library shared across projects. Do not edit the installed package in `node_modules`; compose or override with `src/components/general/` components and `src/styles/main.css` instead.
- `.env` is gitignored but exists locally with secrets. Do not commit it. It is also excluded by `.dockerignore`; production passes it with `docker run --env-file`.
- **Rate limiting:** `src/utils/rate-limit.ts` (in-memory fixed window, per process). Unauthenticated endpoints that send email or check secrets (`get-login-code`, `login`, `contact`) must be rate limited.
- **Validation:** validate untrusted request bodies with the zod schemas in `src/schemas/` via `parseWithSchema`. Throw `AppError` for messages that are safe to show; catch blocks return `safeErrorMessage` so internal errors never reach the client.
- **HTML columns:** any `html: true` column that accepts user input must be sanitized with `sanitizeRichTextHtml` (or `sanitizeUserBio` for `users.bio`) before it is stored or rendered with `dangerouslySetInnerHTML`.
- **Outgoing email outside production** goes through `resolveEmailRecipient` (`src/functions/backend/email/resolve-email-recipient.ts`) and is redirected to `DEV_EMAIL_RECIPIENT`. Never hardcode recipient addresses.
- **Never trust ids from the request body for ownership or sessions.** Use the session `user.id`, and gate acting on other users with the `src/utils/rbac/` helpers (`canUpdateUser` etc.).
- `secrets/` directory is also gitignored.
- `external/` binary directories (`**/models`, `**/bin`, `**/x-86`, `**/arm-64`) are gitignored.