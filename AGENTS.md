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

`src/cron/index.ts` is the single registration point called from `server.ts`. Tasks live in one folder each (`src/cron/<name>/index.ts`) as default-exported async functions, scheduled with in-process `Bun.cron` via `registerCronJob({ title, schedule, task, run_on_start })` (`src/cron/register-cron-job.ts`), which logs before each run and catches/logs errors. Schedules are cron expressions or nicknames (`@hourly`) interpreted in UTC; runs never overlap. Gated in production by `MAIN_SERVER`. The bundled `heartbeat` task doubles as a DB-liveness probe; `sync-harness-models` refreshes the model catalog hourly.

### Admin CRUD API

`api/admin/crud/[[...paths]].ts` dispatches `GET/POST/PUT/DELETE` by table name: `userAuth` → `read_only` GET-only gate → per-table switch → generic fallback (super admin only). Tables without custom handlers fall through to generic CRUD with zero code. Customize a table by adding `src/pages/api/admin/crud/(tables)/<table>/` with `index.ts` + per-method files, then add a `case` in the router.

### Bots (the chat shell)

- **Tables:** `bots` (per user; `kind` worker|coordinator, `hue`, `role`, `face`, `status_line`, `system_prompt` (the bot's core instructions, markdown), `unread`), `bot_messages`, `bot_tasks`, `bot_task_steps`. Enums in `src/dict/bot-dict.ts`.
- **Coordinator:** every user has exactly one `kind: coordinator` bot that coordinates the crew and delegates to the workers. It is created with the account (signup, `bun run seed`) and, as a fallback, by `/admin/bots`, all via `ensureCoordinatorBot` (`src/functions/backend/db/bots/ensure-coordinator-bot.ts`, idempotent). Name in `CoordinatorBotName` (`src/dict/bot-dict.ts`). Its default prompt is `CoordinatorSystemPrompt` (`src/data/coordinator-system-prompt.ts`): attached at creation, and backfilled onto a coordinator whose prompt is empty, never over an edited one.
- **Routes:** `/admin/bots` ensures the coordinator and redirects to its chat (`/admin/bots/1` on a fresh install); `/admin/bots/[bot_id]` renders conversation + working-on panel; `/admin/bots/[bot_id]/models` is a worker bot's own model settings (the coordinator's redirects to its chat). Both render in the full-bleed `src/layouts/bots/` layout (rail of conversations + user popover), which `__root.tsx` uses for every `/admin/*` page.
- **Server:** `src/functions/backend/db/bots/` (`grab-bots`, `grab-bot-messages`, `grab-active-bot-task`, `grab-user-bot`, `mark-bot-read`, `insert-user-message`). `api/admin/bots/send-message.ts` posts a user message to a bot owned by the session user (zod: `src/schemas/bot-schema.ts`), queues the bot's reply (`enqueueBotReply`) and wakes the queue (`src/bots-queue/wake-bots-queue.ts`; never import `src/bots-queue/index.ts` from a page or API route, it pulls the bunext runtime into the page bundles). `upload-attachment.ts` stores one file for the next message (private `media` row, paradigm `bot-attachment`, type from `attachmentFileKind`, documents get `text_content`, limits in `AppData.BotAttachment*`) and `send-message` takes their `media_ids` (checked to be the user's own by `grabAttachableMedia`), linked in `bot_message_media`; messages carry `attachments` (`BotMessageWithAttachments`). `mark-read.ts` clears unread for a message that arrives in the open conversation; `save-harness-settings.ts` saves a worker bot's models.
- **Attachments and thinking:** the composer uploads files as they're picked, pasted or dropped (`use-composer-attachments`), shows them as chips, and sends once none is still uploading; the thread shows images as thumbnails and other files as chips. Replies read the files of the last `BotReplyAttachmentMessages` messages with any (`load-attachment-parts.ts`: images and audio as parts, documents as their text up to `BotAttachmentMaxTextChars`, videos as a note); older ones are only named. Tasks don't get the files yet. While a reply runs (face `working`, status `BotReplyJobTitle`) or waits for a model (`BotWaitingStatusLine`), `BotThinkingRow` sits under the last message. Live notices come from the process that ran the job, so two dev servers on one database split them.
- **Avatars:** `BotStone` (`src/components/general/bot-stone.tsx`) renders the stone inline from `src/data/stone-geometry.ts`, hue as a fill token, face (`idle|working|done|asleep|needs-you`) drawn as eyes. The coordinator is hue-less (ink body, paper eyes; inverts in dark). Never put a stone in a circle/badge or add outline/shadow. Wordmark is vector (`Wordmark`, `src/data/wordmark-paths.ts`), never live text.
- **Copy helpers:** `src/utils/crew-status.ts` (`3 working · 1 needs you`, "Three bots are working. One needs you."), `src/utils/relative-time.ts` (relative timestamps only).
- **Prompt and memory (self-learning):** a bot has `system_prompt` (core instructions) and a separate `memory` (markdown, what it must always remember). The bot rewrites both as it adapts to the user (`update-bot-system-prompt`, `update-bot-memory` in `src/functions/backend/db/bots/`; whole-text replace, capped at `AppData.PromptMaxLength`). `grab-bot-prompt` builds the full prompt via `composeBotPrompt` (`src/utils/compose-bot-prompt.ts`): core instructions, then each non-archived workspace's `system_prompt` under `# Workspace: <name>`, then `# Memory`.
- **Queue:** every bot job goes through `bots_queue`, with `kind` (`BotJobKinds`): `reply` (answers the user in chat, no task row) or `task` (long-running work, typically on a computer). Long-running work goes through `bots_queue`, a bun-sqlite `isQueue` table worked with the native `BunSQLite.queue` API (`status` pending|processing|completed|failed, `attempts`, `available_at`, `locked_at`/`locked_by`, `last_error`; options in `AppData.BotQueue*`). Not every message needs a job: the bot replies right away that it's on it and `enqueueBotJob` queues the brief (`instructions`, `params`, optional `message_id`/`computer_id`, the computer checked against the bot's access; a `bot_tasks` row is created for the working-on panel unless `task_id` is given). DB helpers in `src/functions/backend/db/bots-queue/`: `claimBotJobs`, `updateBotJob` (renews the lock, saves `progress`/`checkpoint`; false once lost or cancelled), `completeBotJob` (result message, task done, face done/needs-you), `failBotJob` (backoff retry, or `fatal`; out of attempts posts a needs-you message via `notifyBotJobFailed`), `cancelBotJob` (failed with `BotJobCancelledError`, `src/dict/bot-queue-dict.ts`), `releaseWorkerBotJobs`.
- **Queue handler:** `src/bots-queue/index.ts`, started from `server.ts` after cron and gated the same way. It releases its own cut-off jobs on startup (stable worker `AppData.BotQueueWorker`), then polls every `BotQueuePollMs`: reports jobs bun-sqlite failed on a lock timeout (`report-lost-bot-jobs`), claims per kind (`claimBotJobs` mirrors bun-sqlite's atomic claim plus `kind`, since `queue.claim` has no filter) up to `BotQueueReplyConcurrency` replies and `BotQueueConcurrency` tasks on separate slots, and runs each with `processBotJob` (heartbeat at a quarter of the lock timeout, abort on cancel/loss, one task per computer and one reply per bot via `createKeyLock`, face `working` once it starts, outcome pushed live). The actual work is `run-bot-job.ts` (`BotJobRunner`, context in `types.ts`), which dispatches to `run-bot-reply.ts` and `run-bot-task.ts`. Throw `BotJobFatalError` for failures retrying can't fix. When every model is resting (`HarnessError.resting`, nothing was tried) the job is put back with `deferBotJob` until the first comes back, its attempt refunded and the bot's face `asleep`; other retryable harness errors retry no sooner than their `retry_at`. The `prune-bots-queue` cron deletes finished jobs after `BotQueueRetentionDays`.
- **Live updates:** server push only. `sendToUser` (`src/websocket/(functions)/send-to-user.ts`) sends to one user's sockets; `pushBotNotice` sends `server:bot-message` (the message row, user messages too, for other tabs) and `server:bot-updated` (`BotUpdatedData`: face, status line, active task). The bots layout opens one socket (twui `useWebSocket`); components listen with `useServerEvent` (`src/hooks/`), and `useLiveBots` keeps the rail and header current. The conversation dedupes messages by id; the working-on panel takes the pushed task.
- **Workspaces:** `workspaces` (per user, `name`, `description`, `system_prompt` shared by every bot in it, `archived`), with bots assigned through `workspace_bots` and computers through `workspace_computers`. Helpers in `src/functions/backend/db/workspaces/` (`create-workspace`, `update-workspace`, `add/remove-bot-*`, `add/remove-computer-*`), all ownership-checked against the session user.
- **Computers:** a computer is an AIO sandbox in its own docker container on the `AppData.DockerNetworkName` network. `containers` records every docker container the app knows about except the main app container (`name` doubles as the hostname, plus `docker_id`, `image`, `network`, `port`, `status`, `metadata`). `computers` (per user, `kind` main|sandbox, `container_id`) and `bot_computers` (direct access). Each user has one main computer, recorded with the account (signup, `bun run seed`) and as a fallback by `/admin/bots` via `ensureMainComputer` (`src/functions/backend/db/computers/ensure-main-computer.ts`, idempotent), which also records its container (`AppData.MainComputerContainerName`, created by the installer) and grants the coordinator access. That one grant can't be removed (`isLockedComputerAccess`, enforced in `remove-bot-from-computer` and the `bot_computers` CRUD handler); every other grant can. A bot's effective computers (`grab-bot-computers`) are its direct grants plus every computer assigned to a non-archived workspace it's in. Enums in `src/dict/computer-dict.ts`.
- **Not built yet:** add-bot flow, routines, help, task steps (the working-on panel shows the task title; nothing writes `bot_task_steps` yet), telling the coordinator when a delegated task finishes.

### Envs

Envs are set in Settings, under Environment (super admin only), not in `.env`. Table `envs` (private): `key`, encrypted `value`, `description`, `paradigm` (`EnvParadigms`: general, workspace, computer) with `workspace_id`/`computer_id`, `secret`, `expose_to_computers`. One per key and scope, enforced in `saveEnv` (`src/functions/backend/db/envs/`), since SQLite unique constraints treat NULL ids as distinct. Decrypted rows are cached per process (`grabAllEnvs`; `saveEnv`/`deleteEnv` clear it).

- **App settings** (`EnvDict` in `src/dict/env-dict.ts`: `MAIN_COMPUTER_URL` and every provider preset's `key_env`) are what the app reads, through `grabEnv({ key })`: the general value, else `process.env`, so an existing `.env` still works. General only, never on computers. `ProcessOnlyEnvKeys` (`ENCRYPTION_KEY`/`SALT`, `PORT`, `DATA_DIR`, `MAIN_SERVER`) can't be saved: they encrypt the table or are read before the database opens.
- **Bot and computer envs** are any other key. `grabComputerEnvs` resolves one run's set (`resolveScopedEnvs`): computer beats workspace beats general; workspaces are the non-archived ones the computer shares with the run's bot, oldest winning a tie. `openComputerTools` writes them to `~/.cobble/env` and `env.json` on the computer (owner only, rewritten every run) over the sandbox's REST API (`writeComputerEnv`); the sandbox's shells read no profile, so `withComputerEnv` makes `sandbox_execute_bash` source the file and `sandbox_execute_code` (Python, JavaScript) load the JSON, invisibly to the model. Bots get keys and descriptions in the task prompt, never values, and every computer tool result is passed through `redactSecrets` (each secret value shown as `[KEY]`).
- **API:** `api/admin/envs/` (`save-env`, `delete-env`), super admin only, logged by key, each returning `grabEnvsOverview` (secret values left out; a secret is only replaced, never read back).

### Harness (the model layer)

`src/harness/` is the brain: every model call goes through it. Install-wide, managed by super admins at `/admin/settings/models`.

- **Harnesses** (`Harnesses` in `src/dict/harness-dict.ts`): `text` (chats, plans, calls tools, drives computers; always on), `vision` ("Media reading": images/scans/screenshots for a text model that can't see), `transcription` (speech to text), `speech` (text to speech), `image` (image generation). Each has one `harness_settings` row (no row = automatic, on, with fallback): a `provider_id` (a `harness_providers` row the harness is limited to, for its pick and its automatic picks; null for any provider; with no row, the default provider, OpenRouter, `grabDefaultHarnessProviderId`), a pinned `model_id` (a `harness_models` row from that provider, not a foreign key) or null for automatic, `fallback` (also try the automatic picks), `enabled`, `options` (`voice`).
- **Providers** (`HarnessProviderKinds` in `src/dict/harness-provider-dict.ts`): OpenRouter (default, created by `ensureDefaultHarnessProvider`), OpenAI, Anthropic, Gemini, DeepSeek, Groq, Mistral, xAI, Ollama (local, its models count as free), any OpenAI-compatible server. Rows in `harness_providers` (a private table: the key is encrypted with `src/utils/crypt.ts`, never sent to the client; falls back to the preset's env, e.g. `OPENROUTER_API_KEY`, via `grabEnv`). One adapter today, `src/harness/providers/openai-compatible/` (`chat`, `transcribe`, `speak`, `generateImage`, `listModels`), chosen in `grab-harness-adapter.ts`; a provider needing a native API gets its own adapter there (`HarnessAdapter` in `src/harness/types.ts`).
- **Catalog:** `harness_models` per provider (modalities, tools support, voices, Artificial Analysis scores, `free`, `available`). The `sync-harness-models` cron (hourly, on start) refreshes every enabled provider (`syncAllHarnessModels`); unlisted models are kept but marked unavailable. OpenRouter lists every modality with capabilities; other providers list ids, so capabilities are guessed (`guess-model-modalities`). Free on OpenRouter means `:free` or `openrouter/free`, never zero token prices.
- **Automatic picks** (`rank-auto-models`): free models that can do the job (on the setting's provider when it has one; a provider without free models needs a picked model) (`model-serves-harness`: text needs tools), by vendor `AutoModelVendorPreference` (DeepSeek, Qwen, NVIDIA, Liquid), then other vendors that look competent (`AppData.HarnessAutoMin*`), then routers; within a vendor by intelligence index, then full-size before small, newest first. Transcription puts real speech-to-text models first.
- **Calling:** `resolveHarnessCandidates` (pinned, then automatic) -> `withCandidates` tries them in order with process-wide cooldowns (`resolve/harness-cooldowns.ts`): rate limits and outages rest the model (until `Retry-After` when given), 401/402 rest the whole provider, 403/404 rest the model for an hour. Errors are `HarnessError` (`code` provider|unavailable|aborted, `retryable`), classified in `to-harness-error.ts`. Entry points: `text/generate-text.ts` (one turn), `text/run-text-loop.ts` (tool loop, sticks to one model, wraps up after `HarnessMaxToolSteps`, trims the oldest tool output before each turn to fit the model's context, `fit-transcript-to-context.ts`), `media/read-image.ts`, `media/read-media.ts` (documents locally via `fileToText`, images and audio through their harnesses), `audio/transcribe-audio.ts`, `audio/speak-text.ts`, `image/generate-image.ts`. A text model that can't take an image or audio part gets it read by the vision/transcription harness first (`prepare-messages-for-model.ts`).
- **Per-bot models:** a worker bot inherits the defaults per harness unless it has a `bot_harness_settings` row (same fields as `harness_settings`, unique per bot and harness). `grabHarnessSetting({ harness, bot_id })` returns the bot's row (`source: "bot"`) or the default; the coordinator always gets the default. Every entry point takes `bot_id` and passes it on (text loop -> media reading/transcription), so a bot's run uses its own models throughout. Saved by `saveBotHarnessSetting` (`inherit` deletes the row); the page data is `grabBotHarnessOverview`. A bot's chat header has a model button (the text model it runs on) that opens a modal with every harness (`(partials)/bot-models-modal.tsx`); the modal and `/admin/bots/[bot_id]/models` both use `(partials)/bot-harness-form.tsx`. On the coordinator the modal edits the defaults themselves (`api/admin/harness/save-settings`, the same settings as Settings, under Models, without the providers): super admins only, the button is read only for everyone else. Every one of these wraps `settings/models/(partials)/harness-settings-form.tsx`: per harness a provider select first (`harness-provider-select.tsx`: any provider, one provider, or on a bot "Same as the default"), then the model select narrowed to it. Removing a provider (`deleteHarnessProvider`) puts default and bot settings that picked it or its models back on any provider (`save` prop; "Same as the default" shows when the overview item has `default`).
- **Tools:** `HarnessTool` (built per run with its bot bound): own tools validate with a zod `schema`; tools described elsewhere pass a JSON schema as `parameters` and validate themselves. `run-tool-call.ts` reports bad calls and failures back to the model as `Error: ...`. Bot tools in `src/harness/tools/bot/`: `update_memory`, `update_instructions` (`grabBotTools`, every run), `start_task` and, for the coordinator with workers, `delegate_task` (`grabBotChatTools`, chat replies only).
- **MCP:** `src/harness/mcp/`: `connectMcpServer` (Streamable HTTP, SSE fallback), `grabMcpTools` (each server tool becomes a `HarnessTool` with its JSON schema), `mcpResultToText` (text as is, images read by the vision harness, `isError` thrown). Computers are reached this way: `openComputerTools` (`src/harness/tools/computer/`) connects to the computer's AIO sandbox at `grabComputerMcpUrl` (container `metadata.mcp_url`, else the `MAIN_COMPUTER_URL` app setting for the main computer, for a dev server outside docker, e.g. `http://localhost:8170`, else `http://<hostname>:<port>/mcp`), leaves out `ComputerMcpExcludedTools`, and sets the computer's envs (see Envs).
- **Replies and tasks:** `run-bot-reply.ts` answers from the last `BotReplyHistoryMessages` messages (`botMessagesToHarness`) with `ChatReplyNote` and the chat tools, at most `BotReplyMaxToolSteps` steps, and finishes silently if the bot already had the last word (`enqueueBotReply` reuses a pending reply, so a burst of messages gets one). `run-bot-task.ts` runs the brief (`compose-job-brief.ts`) with `TaskRunNote`, the bot tools and the job's computer tools, closing the MCP connection after. Retryable harness errors go back to the queue's backoff, the rest are `BotJobFatalError`.
- **API:** `api/admin/harness/` (`save-provider` also syncs, `sync-provider`, `delete-provider`, `save-settings`), super admin only, each returning the fresh `grabHarnessOverview()` page data.

## Admin Route Hierarchy

Live routes under `/admin` (see `AdminSections`): `/admin/bots` and `/admin/settings`. `/admin` redirects to `/admin/bots`; there is no dashboard. The rest below are built but closed for now (redirect to `/admin/bots`):

- `/admin/people` - admin users list, plus `create/`, `[user_id]/` (profile), `[user_id]/edit/`
- `/admin/bots` (live) - the Cobble chat shell, plus `[bot_id]/`
- `/admin/logs` - audit log (super admin; the "Activity" item in the bots popover is disabled while this is closed)
- `/admin/backups` - super admin only: create/list/download database snapshots in `db/.backups`, plus `restore/` (restore a listed backup, or upload a SQLite database file which is saved to `.backups` then restored). Shells out to the `bun-sqlite` CLI (`backup`, and `import <file>` since `restore` is interactive) via `src/functions/backend/backups/`; API routes in `api/admin/backups/`
- `/admin/settings` (live) - redirects to `SettingsDefaultPath` (`/admin/settings/general`). Sub pages: `general/` (theme: System/Light/Dark per device via `useThemePreference`, stored in `localStorage[AppData.ThemeStorageKey]`, the same key `ThemeInitScript` and twui's `ColorSchemeSelector` read; applies instantly, no save bar), `profile/` (current user profile), `change-password/` (set/change own password) `models/` (super admin only, `super_admin_only` in the dict hides it from the rail: model providers and which model each harness uses) and `environment/` (super admin only: app settings and the envs bots and computers use, per scope), each wrapped in `SettingsShell` (`(partials)/settings-shell.tsx`: 64px pane header like the conversation header, then one centered column). Content is built from `SettingsGroup` blocks (label + description left, controls right, hairline-separated, no cards) and ends with the sticky `SettingsSaveBar` (Save enabled only when dirty, Discard, one-line status). Saves don't reload the page. Keep save notices in component state: `useFormInit` clears `status` whenever the form changes. Sub pages are declared once in `src/dict/settings-pages-dict.ts`; on every `/admin/settings/*` page the rail swaps the crew for a back link plus that list. Add a sub page by adding its folder and a dict entry

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

- **`src/hooks/`** - Shared React hooks: `use-admin-crud-get`, `use-fetch-get`, `use-form-init`, `use-local-user`, `use-users-get`, `use-server-event`, `use-live-bots`
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