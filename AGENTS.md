# Agent Instructions

This is **Cobble** (`cobble.moduletrace.org`): an open-source crew of small AI worker bots. The design handoff in `assets/handoff/` (gitignored locally: `PRODUCT.md`, `IMPLEMENTATION.md`, `tokens/`) is the starting point for the core concepts and visual language, not the end product. The app is expected to move away from it; when it and the current code or the user disagree, the code and the user win. Unit noun is **bot**, never "agent" or "expert".

## Stack

- **Runtime:** Bun - not Node. Use `bun` commands, never `npm`/`npx`.
- **Framework:** `@moduletrace/bunext` - not Next.js. Routing is filesystem-based under `src/pages/`, served by `Bun.serve` in `src/server.ts`.
- **Database:** `@moduletrace/bun-sqlite` - SQLite database. Schema in `db/schema.ts`, generated types in `db/types/db.ts`. Config in `bun-sqlite.config.ts`.
- **UI:** Tailwind CSS v4 + the `@moduletrace/twui` component library (installed package) + shared components in `src/components/general/`. There is **no** shadcn/ui, no `tailwind.config`, and no `components.json` - twui is the only component system. CSS chain: `src/pages/__root.tsx` imports `src/styles/main.css`, which imports `@moduletrace/twui/base.css` (`@import "tailwindcss"`). Theme tokens (colors/radius/fonts) are overridden via the `@theme inline` block in `src/styles/main.css`.
- **Icons:** `lucide-react`.
- **Validation:** `zod` v4 (`zod@4.1.12`).
- **Branding:** Site name/slug live only in `src/data/site-data.ts`. Logo source of truth is `public/logos/logo.svg` (the ember stone; rendered inline via `BotStone` in `src/components/general/logo-icon.tsx`); browser favicon/assets are generated from it. Handoff brand assets (stones, coordinator, wordmarks, app icon) live in `public/brand/`.

## Entrypoint

`src/server.ts` - turns on SQLite foreign keys (`enableForeignKeys`, so the schema's cascades fire; off by default per connection), runs `bunextInit()`, starts `Bun.serve`, then starts cron:

- `/media/*` short-circuits to the media server handler
- `/ws` upgrades only after `userAuth` succeeds (session frozen into the socket at upgrade time); the `websocket` handler object lives in `src/websocket/`
- everything else goes to `bunext.bunextRequestHandler`
- `cron()` and the bots queue handler (`botsQueue()`, `src/bots-queue/`) start after the server is up; in production both are gated to the `MAIN_SERVER` container

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
| Seed sample bot crew             | `bun run seed:bots [email]` (runs `src/scripts/seed-bots.ts`, idempotent: adds sample messages to the existing coordinator and the sample workers, skips users who already have workers) |
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
    - No public pages: anything outside the live admin sections (`AdminSections` in `src/dict/admin-sections-dict.ts`: `/admin/bots`, `/admin/settings`) and `/auth` redirects to `AdminHomePath` (`/admin/bots`). `/admin` itself only redirects there. People, logs and backups exist in code but are closed until added back to `AdminSections` and the aside dict
    - No users at all: everything redirects to `/auth/signup` (first-run super admin setup, `grabHasUsers`); once a user exists `/auth/signup` redirects away
    - Redirects unauthenticated `/admin/*` → `/auth/login`
    - Unknown `/admin/settings/*` pages (not in `SettingsPages`, `src/utils/is-unknown-settings-path.ts`) redirect to `/admin/settings/general`
    - Already-authenticated users hitting `/auth/*` (except paths containing `/logout`) are redirected to `/admin/bots`; login and signup land there too
- **Session:** encrypted auth cookie (AES-256-GCM, PBKDF2-derived key from `ENCRYPTION_KEY`/`ENCRYPTION_SALT`) plus a CSRF cookie. `userAuth` (`src/functions/backend/auth/user-auth.ts`) decrypts, checks expiry (`AuthExpiryDays`, 60) against the embedded `date`, verifies the CSRF cookie against the token embedded in the session (constant-time, `src/utils/safe-compare.ts`), and re-reads `user_types` from the DB every request (revoked users lose access immediately).
- **Login:** local install, so email or username plus password only (`api/auth/password-login.ts`, rate limited), no emailed code step and no emailed password reset. Google login (`api/auth/google-login.ts`) is for existing accounts only and shows when `GOOGLE_CLIENT_ID` is set; it never creates accounts. Sessions are issued by `src/functions/backend/auth/login-user.ts` (supports `reauth` for silent refresh without audit logging).
- **Signup:** first-run only. `api/auth/signup.tsx` refuses once any user exists, creates the super admin (`create-super-admin-user.ts`, so user #1) with a required password, and logs them in. No Google signup. `bun run seed` (needs `SEED_SUPER_ADMIN_PASSWORD`) is the headless alternative.
- **Passwords:** bcrypt hashes live in the separate `user_passwords` table (never in `users`; blocked from the CRUD API via `src/dict/private-tables.ts`). Set/change at `/admin/settings/change-password`.
- **Auth layout:** `/auth/*` (except `/auth/logout`) renders in `src/layouts/auth/` with no site header/footer.
- **RBAC:** `src/utils/check-user-access.ts` (includes/excludes primitive, `super_admin` bypass) plus the declarative engine in `src/utils/rbac/` - `userTypeAssignment` interprets `UserTypeAssignmentMatrix`/`UserTypeDeletionMatrix` in `src/dict/user-types-dict.ts`. `read_only` users are blocked from non-GET CRUD in the router.
- **Audit trail:** `src/functions/backend/logger.ts` - `logEvent`/`logError` write to the `logs` table. Signup, login, Google login, logout, cron runs, and WebSocket connects are all logged.

### WebSocket

- Upgrades on `/ws` with `userAuth` validation (401 if not logged in); `WebSocketSession` (`src/websocket/types.ts`) carries `{ user, user_types }`.
- Rooms declared in `src/dict/websocket-rooms.ts` -> typed `WebsocketRoomType`. Store in `src/websocket/(data)/rooms.ts`: `WeakMap` for per-client metadata, `Map<room, Set<ws>>` for lookups, empty rooms deleted. Join/leave/broadcast in `src/websocket/(functions)/`.
- Message dispatch in `handle-message.ts`: `client:ping` → `server:pong`, unknown events → `error`. The twui `useWebSocket` hook sends a raw `"twui::ping"` keepalive string - non-JSON messages are ignored.
- Client handlers: `src/websocket/client-requests/<event>/index.ts` (folder-per-event), replying through `wsSendData`.

### Cron

`src/cron/index.ts` is the single registration point called from `server.ts`. Tasks live in one folder each (`src/cron/<name>/index.ts`) as default-exported async functions, scheduled with in-process `Bun.cron` via `registerCronJob({ title, schedule, task, run_on_start })` (`src/cron/register-cron-job.ts`), which logs before each run and catches/logs errors. Schedules are cron expressions or nicknames (`@hourly`) interpreted in UTC; runs never overlap. Gated in production by `MAIN_SERVER`. The bundled `heartbeat` task doubles as a DB-liveness probe.

### Admin CRUD API

`api/admin/crud/[[...paths]].ts` dispatches `GET/POST/PUT/DELETE` by table name: `userAuth` → `read_only` GET-only gate → per-table switch → generic fallback (super admin only). Tables without custom handlers fall through to generic CRUD with zero code. Customize a table by adding `src/pages/api/admin/crud/(tables)/<table>/` with `index.ts` + per-method files, then add a `case` in the router.

### Bots (the chat shell)

- **Tables:** `bots` (per user; `kind` worker|coordinator, `hue`, `role`, `face`, `status_line`, `system_prompt` (the bot's core instructions, markdown), `unread`), `bot_messages`, `bot_tasks`, `bot_task_steps`. Enums in `src/dict/bot-dict.ts`.
- **Coordinator:** every user has exactly one `kind: coordinator` bot that coordinates the crew and delegates to the workers. It is created with the account (signup, `bun run seed`) and, as a fallback, by `/admin/bots`, all via `ensureCoordinatorBot` (`src/functions/backend/db/bots/ensure-coordinator-bot.ts`, idempotent). Name in `CoordinatorBotName` (`src/dict/bot-dict.ts`). Its default prompt is `CoordinatorSystemPrompt` (`src/data/coordinator-system-prompt.ts`): attached at creation, and backfilled onto a coordinator whose prompt is empty, never over an edited one.
- **Routes:** `/admin/bots` ensures the coordinator and redirects to its chat (`/admin/bots/1` on a fresh install); `/admin/bots/[bot_id]` renders conversation + working-on panel. Both render in the full-bleed `src/layouts/bots/` layout (rail of conversations + user popover), which `__root.tsx` uses for every `/admin/*` page.
- **Server:** `src/functions/backend/db/bots/` (`grab-bots`, `grab-bot-messages`, `grab-active-bot-task`, `grab-user-bot`, `mark-bot-read`, `insert-user-message`). `api/admin/bots/send-message.ts` posts a user message to a bot owned by the session user (zod: `src/schemas/bot-schema.ts`).
- **Avatars:** `BotStone` (`src/components/general/bot-stone.tsx`) renders the stone inline from `src/data/stone-geometry.ts`, hue as a fill token, face (`idle|working|done|asleep|needs-you`) drawn as eyes. The coordinator is hue-less (ink body, paper eyes; inverts in dark). Never put a stone in a circle/badge or add outline/shadow. Wordmark is vector (`Wordmark`, `src/data/wordmark-paths.ts`), never live text.
- **Copy helpers:** `src/utils/crew-status.ts` (`3 working · 1 needs you`, "Three bots are working. One needs you."), `src/utils/relative-time.ts` (relative timestamps only).
- **Prompt and memory (self-learning):** a bot has `system_prompt` (core instructions) and a separate `memory` (markdown, what it must always remember). The bot rewrites both as it adapts to the user (`update-bot-system-prompt`, `update-bot-memory` in `src/functions/backend/db/bots/`; whole-text replace, capped at `AppData.PromptMaxLength`). `grab-bot-prompt` builds the full prompt via `composeBotPrompt` (`src/utils/compose-bot-prompt.ts`): core instructions, then each non-archived workspace's `system_prompt` under `# Workspace: <name>`, then `# Memory`.
- **Queue:** long-running work (typically on a computer) goes through `bots_queue`, a bun-sqlite `isQueue` table worked with the native `BunSQLite.queue` API (`status` pending|processing|completed|failed, `attempts`, `available_at`, `locked_at`/`locked_by`, `last_error`; options in `AppData.BotQueue*`). Not every message needs a job: the bot replies right away that it's on it and `enqueueBotJob` queues the brief (`instructions`, `params`, optional `message_id`/`computer_id`, the computer checked against the bot's access; a `bot_tasks` row is created for the working-on panel unless `task_id` is given). DB helpers in `src/functions/backend/db/bots-queue/`: `claimBotJobs`, `updateBotJob` (renews the lock, saves `progress`/`checkpoint`; false once lost or cancelled), `completeBotJob` (result message, task done, face done/needs-you), `failBotJob` (backoff retry, or `fatal`; out of attempts posts a needs-you message via `notifyBotJobFailed`), `cancelBotJob` (failed with `BotJobCancelledError`, `src/dict/bot-queue-dict.ts`), `releaseWorkerBotJobs`.
- **Queue handler:** `src/bots-queue/index.ts`, started from `server.ts` after cron and gated the same way. It releases its own cut-off jobs on startup (stable worker `AppData.BotQueueWorker`), then polls every `BotQueuePollMs`: reports jobs bun-sqlite failed on a lock timeout (`report-lost-bot-jobs`), claims up to `BotQueueConcurrency`, and runs each with `processBotJob` (heartbeat at a quarter of the lock timeout, abort on cancel/loss, one job per computer via `createKeyLock`, face `working` once it starts, outcome pushed live). The actual work is `run-bot-job.ts` (`BotJobRunner`, context in `types.ts`): the model layer plugs in there; until then it throws `BotJobFatalError`. Throw `BotJobFatalError` for failures retrying can't fix. The `prune-bots-queue` cron deletes finished jobs after `BotQueueRetentionDays`.
- **Live updates:** server push only. `sendToUser` (`src/websocket/(functions)/send-to-user.ts`) sends to one user's sockets; the queue pushes `server:bot-message` and `server:bot-updated`. The client doesn't listen yet.
- **Workspaces:** `workspaces` (per user, `name`, `description`, `system_prompt` shared by every bot in it, `archived`), with bots assigned through `workspace_bots` and computers through `workspace_computers`. Helpers in `src/functions/backend/db/workspaces/` (`create-workspace`, `update-workspace`, `add/remove-bot-*`, `add/remove-computer-*`), all ownership-checked against the session user.
- **Computers:** a computer is an AIO sandbox in its own docker container on the `AppData.DockerNetworkName` network. `containers` records every docker container the app knows about except the main app container (`name` doubles as the hostname, plus `docker_id`, `image`, `network`, `port`, `status`, `metadata`). `computers` (per user, `kind` main|sandbox, `container_id`) and `bot_computers` (direct access). Each user has one main computer, recorded with the account (signup, `bun run seed`) and as a fallback by `/admin/bots` via `ensureMainComputer` (`src/functions/backend/db/computers/ensure-main-computer.ts`, idempotent), which also records its container (`AppData.MainComputerContainerName`, created by the installer) and grants the coordinator access. That one grant can't be removed (`isLockedComputerAccess`, enforced in `remove-bot-from-computer` and the `bot_computers` CRUD handler); every other grant can. A bot's effective computers (`grab-bot-computers`) are its direct grants plus every computer assigned to a non-archived workspace it's in. Enums in `src/dict/computer-dict.ts`.
- **Not built yet:** add-bot flow, attachments, routines, help, client handling of live WebSocket updates, the model layer (plugs into `src/bots-queue/run-bot-job.ts`).

## Admin Route Hierarchy

Live routes under `/admin` (see `AdminSections`): `/admin/bots` and `/admin/settings`. `/admin` redirects to `/admin/bots`; there is no dashboard. The rest below are built but closed for now (redirect to `/admin/bots`):

- `/admin/people` - admin users list, plus `create/`, `[user_id]/` (profile), `[user_id]/edit/`
- `/admin/bots` (live) - the Cobble chat shell, plus `[bot_id]/`
- `/admin/logs` - audit log (super admin; the "Activity" item in the bots popover is disabled while this is closed)
- `/admin/backups` - super admin only: create/list/download database snapshots in `db/.backups`, plus `restore/` (restore a listed backup, or upload a SQLite database file which is saved to `.backups` then restored). Shells out to the `bun-sqlite` CLI (`backup`, and `import <file>` since `restore` is interactive) via `src/functions/backend/backups/`; API routes in `api/admin/backups/`
- `/admin/settings` (live) - redirects to `SettingsDefaultPath` (`/admin/settings/general`). Sub pages: `general/` (theme: System/Light/Dark per device via `useThemePreference`, stored in `localStorage[AppData.ThemeStorageKey]`, the same key `ThemeInitScript` and twui's `ColorSchemeSelector` read; applies instantly, no save bar), `profile/` (current user profile) and `change-password/` (set/change own password), each wrapped in `SettingsShell` (`(partials)/settings-shell.tsx`: 64px pane header like the conversation header, then one centered column). Content is built from `SettingsGroup` blocks (label + description left, controls right, hairline-separated, no cards) and ends with the sticky `SettingsSaveBar` (Save enabled only when dirty, Discard, one-line status). Saves don't reload the page. Keep save notices in component state: `useFormInit` clears `status` whenever the form changes. Sub pages are declared once in `src/dict/settings-pages-dict.ts`; on every `/admin/settings/*` page the rail swaps the crew for a back link plus that list. Add a sub page by adding its folder and a dict entry

Every `/admin/*` page renders in the bots layout (`src/layouts/bots/`); there is no separate admin layout or aside. The rail shows the crew (`(partials)/rail-crew-list.tsx`, needs `bots` in page props), except on `/admin/settings/*` where it shows "Back to bots" plus the settings sub pages (`(partials)/rail-settings-list.tsx`). Page heroes use the shared `AdminHero` component (`src/components/general/admin-hero.tsx`).

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
    - `src/functions/backend/` - Server-only: auth (`backend/auth/`), DB queries (`backend/db/` incl. `bots/`), email client + templates (`email/`), media upload, `logger.ts` (audit logging)
    - `src/functions/frontend/` - Client-safe: CRUD handlers, fetch handlers, media upload/delete handlers
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
| `src/components/general/`    | Shared page components built on twui: `logo`, `logo-icon`, `wordmark`, `bot-stone` (+ `bot-stone-face`, `stone-eye-*`), `inner-page-hero-section`, `main-hero-section`, `admin-hero`, `login-shell`, `tagline-section`, media/image helpers |

## UI & Styling Rules (MANDATORY)

- **Always build UI with the twui component library and the shared `src/components/general/` components.** Do not hand-roll HTML for layout, typography, or controls.
  - Layout: `Section`, `Container`, `Stack`, `Row`, `Center`, `Span`, `P`, `H1`-`H5`, `Button`, `Divider`, `Img`, `Link`, `ArrowedLink`, `Main`, `Header`, `Footer`, `Spacer`
  - Elements: `Card`, `Paper`, `Tag`, `HeaderNav` (+ `MainLinks` dict), `LinkList`, `Tabs`, `Table`, `Breadcrumbs`, `Modal`, `Dropdown`, `CheckBulletPoints`, `EmptyContent`, `Loading`, `LoadingBlock`, `Toggle`, `Toast`
  - Forms: `Form`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radios`, `SearchSelect`, `FileUpload`, `ImageUpload`
  - Shared: `Logo`, `LogoIcon`, `InnerPageHeroSection`, `AdminHero`, `LoginShell` (auth pages/forms), `TaglineSection`
- **UNCHANGEABLE RULE - twui components always win over raw JSX elements.** Use twui components (`H1`-`H5`, `P`, `Span`, `List`, `Img`, `Row`, `Stack`, `Container`, `Section`, `Card`, `Button`, `Tag`, `Link`, etc.) before basic JSX elements (`<h1>`-`<h6>`, `<p>`, `<span>`, `<ul>`, `<li>`, `<img>`, `<a>`, `<button>`, `<div>`-as-card, etc.). Never introduce or reintroduce a raw JSX element where a twui equivalent exists. Override twui defaults via `className` rather than reaching for the raw element.
- **Never create new CSS classes, CSS files, or inline `style={{...}}` hacks.** Style exclusively by composing existing component props/classNames, existing twui classNames (`twui-*`), semantic theme-token utilities (`bg-dark`, `bg-light`, `text-dark`, `text-primary`, `bg-primary`, `text-accent`, `bg-accent`, `text-secondary`, `border-slate-200`, etc.), and utility classes already used elsewhere in this codebase. Build up from what exists; extend component code only when the existing API cannot express the need.
- **Theming:** colors, radii, and fonts change only in `src/styles/main.css`: Cobble tokens as CSS vars on `:root` (light) and `.dark`, exposed in the `@theme inline` block as `paper`, `surface`, `sunken`, `ink`, `ink-secondary`, `ink-disabled`, `hairline`, `hairline-strong`, `on-ink`, `hue-<name>`, plus `shadow-popover` and `--m-fast/base/slow` motion vars (zeroed under reduced motion). Font is Lato (stand-in). Never hardcode hex colors, radii, or font stacks inside components. Hues are bot identity only, never state; use `src/dict/bot-hue-classes-dict.ts` for hue classes.
- **Branding:** `public/logos/logo.svg` is the single source of truth for the logo mark; `logo-icon.tsx` renders it inline (via `BotStone`) and `logo.tsx` renders the stone beside the vector `Wordmark`. Whenever the logo changes, run `bun run gen:favicon` to regenerate `public/favicon.ico`, `public/favicon.png`, `public/apple-touch-icon.png`, and `public/logos/logo.png` (the last is used in emails). Font + favicon links live in `__root.tsx` `Head()`.
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
- **Rate limiting:** `src/utils/rate-limit.ts` (in-memory fixed window, per process). Unauthenticated endpoints that send email or check secrets (`password-login`, `signup`, `contact`) must be rate limited.
- **Validation:** validate untrusted request bodies with the zod schemas in `src/schemas/` via `parseWithSchema`. Throw `AppError` for messages that are safe to show; catch blocks return `safeErrorMessage` so internal errors never reach the client.
- **HTML columns:** any `html: true` column that accepts user input must be sanitized with `sanitizeRichTextHtml` (or `sanitizeUserBio` for `users.bio`) before it is stored or rendered with `dangerouslySetInnerHTML`.
- **Outgoing email outside production** goes through `resolveEmailRecipient` (`src/functions/backend/email/resolve-email-recipient.ts`) and is redirected to `DEV_EMAIL_RECIPIENT`. Never hardcode recipient addresses.
- **Never trust ids from the request body for ownership or sessions.** Use the session `user.id`, and gate acting on other users with the `src/utils/rbac/` helpers (`canUpdateUser` etc.).
- `secrets/` directory is also gitignored.
- `external/` binary directories (`**/models`, `**/bin`, `**/x-86`, `**/arm-64`) are gitignored.