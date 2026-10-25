# Agent Instructions

**Cobble** (`cobble.moduletrace.org`): an open-source crew of small AI worker bots. The unit noun is **bot**, never "agent" or "expert".

This file is a map: it names the rules, the invariants and where things live. For detail, read the code it points to. When this file, the handoff, the code and the user disagree, the code and the user win.

## The handoff is outdated

`assets/handoff/` (gitignored) is the project's foundation, not its design. Never use its layouts, `assets/screens/*.png`, right-hand "working on" panel or PRODUCT/IMPLEMENTATION briefs as reference for the UI, docs, screenshots or marketing. Still authoritative:

- **Brand assets** (never change): stone icons (`public/brand/icons/*.svg`, mirrored in `src/data/stone-geometry.ts`), coordinator (`public/brand/coordinator/`), app icon (`public/brand/app-icon/`), wordmark (`public/brand/wordmark/`, mirrored in `src/data/wordmark-paths.ts`). The mark is a stone with exactly one flat cut; a bot's colour is its identity (never status); the coordinator is hue-less. The one sanctioned override is an install's own app icon (Settings > General): another brand stone, or an uploaded image with a brand stone as its top-left corner mark.
- **Tokens:** `src/styles/main.css` is now the source of truth (the handoff `tokens.css` is history).

For the current UI read `src/layouts/bots/` (rail, workspace rail, user popover), `src/pages/admin/bots/[bot_id]/` (header, thread, composer, modals) and `src/pages/admin/workspaces/` (dashboard).

## Stack

- **Runtime:** Bun, not Node. Use `bun`, never `npm`/`npx`.
- **Framework:** `@moduletrace/bunext`, not Next.js. Filesystem routing under `src/pages/`, served by `Bun.serve` in `src/server.ts`.
- **Database:** `@moduletrace/bun-sqlite` (SQLite). Schema `db/schema.ts`, generated types `db/types/db.ts`, config `bun-sqlite.config.ts`.
- **UI:** Tailwind v4 + `@moduletrace/twui` (the only component system: no shadcn, no `tailwind.config`, no `components.json`) + `src/components/general/`. CSS chain: `src/pages/__root.tsx` -> `src/styles/main.css` -> `@moduletrace/twui/base.css`. Theme tokens in the `@theme inline` block of `main.css`.
- **Icons:** `lucide-react`. Never render a lucide icon by name (twui `LucideIcon`, a string `beforeIcon`): it ships every icon. Import the icon.
- **Validation:** `zod` v4 (`zod@4.1.12`).
- **Branding:** site name/slug only in `src/data/site-data.ts`. Logo source `public/logos/logo.svg` (the ember stone, rendered via `BotStone` in `logo-icon.tsx`).

## Commands

| Purpose | Command |
| --- | --- |
| Dev server | `bun run dev` |
| Production | `bun run start` (serves whatever `.bunext/` holds; build first with `NODE_ENV=production bunx bunext build`) |
| Type-check | `bun run typecheck` |
| Tests | `bun run test` (one file: `bun test <file>`; tests are colocated `.test.ts(x)`) |
| Bundle budget (after a production build, CI) | `bun run check:bundle` (fails if the conversation page's initial JS passes budget or the full Lucide set returns) |
| Favicon/brand/PWA assets | `bun run gen:favicon` |
| DB schema sync / admin UI / backup | `bun run db:schema` / `db:admin` / `db:backup` |
| Seed super admin / sample crew | `bun run seed` (needs `SEED_SUPER_ADMIN_PASSWORD`) / `bun run seed:bots [email]` (idempotent) |
| Query DB (read-only, JSON envelope) | `bun llm-code-assistant/query-db.ts "<sql>"` |
| Publish a release | `bun run publish:github` / `publish:gitea`; `bun run mirror:gitea` afterwards |

No linter or formatter. `bun run typecheck` and `bun run test` are the verification steps. Use `query-db.ts` to see what is actually in the database instead of reading ORM code.

Path alias `@/*` resolves from the repo root (`@moduletrace/twui/layout/Button`, `@/src/data/site-data`, `@/db/types/db`).

## Entrypoint (`src/server.ts`)

Enables SQLite foreign keys (`enableForeignKeys`), `bunextInit()`, `ensureDockerNetwork()` (exits without docker: computers are containers), `Bun.serve`, then `cron()`, `botsQueue()`, the file-ingest worker and `liveRelay()` (cron and the queue are gated to `MAIN_SERVER` in production; the relay runs everywhere).

- `/media/*` -> media server; `/computers/<id>/` -> computer proxy; `/ws` upgrades only after `userAuth`; `/sw.js` and PWA files via `handlePwaFile`; precache gate before bunext; everything else -> `bunextRequestHandler`.
- Responses go through `compressResponse` (`src/functions/server/compress-response.ts`): hashed assets cached `immutable` and compressed once (in-memory, bounded); pages/JSON gzipped as they stream; media and streams untouched.
- **Keep page props small:** every page is a full server render. Anything only a modal needs loads when the modal opens (e.g. the models modal fetches `api/admin/harness/catalog` and `api/admin/bots/harness-overview`, cached in `localStorage` by `src/utils/harness-cache.ts`).

## Architecture

### Auth

- **Guard:** `src/pages/__root.server.ts` on every request. No public pages: anything outside `AdminSections` (`src/dict/admin-sections-dict.ts`) and `/auth` redirects to `/admin/bots`. No users -> `/auth/signup` (first-run super admin only); unauthenticated `/admin/*` -> `/auth/login`; authenticated `/auth/*` (not logout) -> `/admin/bots`; unknown `/admin/settings/*` -> `/admin/settings/general`.
- **Session:** AES-256-GCM cookie (key from `ENCRYPTION_KEY`/`ENCRYPTION_SALT`) plus CSRF cookie, `Secure` only over HTTPS (`isSecureRequest`, honours `X-Forwarded-Proto`). `userAuth` (`src/functions/backend/auth/user-auth.ts`) checks expiry (60 days), CSRF (constant-time) and re-reads `user_types` every request.
- **Login:** email/username + password (`api/auth/password-login.ts`, rate limited). No emailed codes or resets. Google login only for existing accounts, when `GOOGLE_CLIENT_ID` is set. Sessions issued by `login-user.ts`.
- **Passwords:** bcrypt in `user_passwords` (never in `users`; blocked from CRUD via `src/dict/private-tables.ts`).
- **User types** (`src/dict/user-types-dict.ts`, the only definition): `super_admin` (user #1), `admin` (only the super admin grants it), `member` (default), `read_only` (non-GET CRUD blocked), `revoked`. A user needs at least one type to sign in.
- **RBAC:** `src/utils/check-user-access.ts` plus the matrix engine in `src/utils/rbac/` (`userTypeAssignment` over `UserTypeAssignmentMatrix`/`UserTypeDeletionMatrix`).
- **Audit:** `src/functions/backend/logger.ts` (`logEvent`/`logError` -> `logs`). Auth events, cron runs, every unexpected API error (`safeErrorMessage` -> `logUnexpectedError`, not for `AppError`), every failed or lost bot job. WebSocket connects are not logged.

### WebSocket

`/ws`, session frozen at upgrade (`src/websocket/types.ts`). Rooms in `src/dict/websocket-rooms.ts`, store in `src/websocket/(data)/rooms.ts`. Dispatch in `handle-message.ts`; client handlers are folder-per-event in `src/websocket/client-requests/<event>/`. Non-JSON messages (twui's `"twui::ping"`) are ignored. Server pushes: `sendToUser`; clients listen with `useServerEvent`.

### Cron

`src/cron/index.ts` registers everything via `registerCronJob` (`src/cron/register-cron-job.ts`); one folder per task. In-process `Bun.cron`, UTC, never overlapping. Notable: `heartbeat`, `sync-harness-models` (hourly), `run-cron-jobs` (every minute, fires schedules), `sync-computers`, `sync-mcp-servers`, `prune-bots-queue`.

### Admin CRUD API

`api/admin/crud/[[...paths]].ts`: `userAuth` -> read-only gate -> per-table handler in `src/pages/api/admin/crud/(tables)/<table>/` -> generic fallback (super admin only). Add a table handler folder plus a `case` in the router.

### Crew access (bots, workspaces, computers)

- Bots, workspaces and computers belong to the install; their `user_id` is only the creator. Users reach them only through grants: `bot_users` (a worker's own chat) and `workspace_users` (every bot in that workspace).
- `crewRole` (`src/utils/rbac/crew-role.ts`): `super_admin` reaches everything and is the **only** one who sees or chats with the coordinator; `admin` reaches every worker and workspace; `member` only their grants. `canManageCrew` (super admin + admin) creates/edits/deletes crew and grants access; DB helpers check it themselves (`assertCrewManager`).
- Access SQL lives in `src/utils/crew-access/` (tested against SQLite) and backs `grabChatBot`, `grabUserBot`, `grabUserWorkspace(s)`, `grabWorkspaceBot`, `grabBots`, `grabUserComputer(s)`.
- Conversations, faces and status lines are **per user** (`bot_sessions.user_id`, `bot_user_faces`). A job runs for its session's user, with that user's memory and reach. Page reads overlay the viewer's face (`botFaceSql`). Status lines never name a task.

### Bot types

`bot_types` is to bots what `user_types` is to users (`src/dict/bot-types-dict.ts`): `coordinator` (install-wide, written only by `ensureCoordinatorBot`), `admin` (scoped to one workspace), `worker` (no row). `BotTypePermissionMatrix`, `BotTypeTargetMatrix`, `BotTypeAssignmentMatrix`/`DeletionMatrix` are read by the generic interpreter `src/utils/rbac/type-assignment.ts`. Every run reads `grabBotRunPowers` once and gates tools on its `is_coordinator`, `admin_workspace_ids` and `can(permission)`, **never on `bots.kind`** (`kind` is only the legacy marker of the coordinator for visibility SQL). A run's powers are its type's AND its user's. A workspace admin gets `grabWorkspaceAdminTools` (delegate to members, set their workspace instructions, edit that workspace). Set via `api/admin/bots/set-bot-type`. Admins are marked with `AdminShield` (green, beside the name, never on the stone).

### Bots, sessions, chat

- **Tables:** `bots` (`kind`, `color` `#rrggbb`, `stone`, `role`, `system_prompt`; `hue` is a legacy fallback), `bot_user_faces`, `bot_sessions`, `bot_messages`, `bot_tasks`, `bot_task_steps` (unused yet). Enums in `src/dict/bot-dict.ts`.
- **Sessions:** one thread per user per bot in its own chat plus one per workspace; split into `bot_sessions` (rollover at `AppData.BotSessionMaxMessages`, titled and summarised by `name-bot-session.ts`, summary carried into the next session). Helpers in `src/functions/backend/db/bot-sessions/`. Job results land in the job's own session, even after it closes.
- **Coordinator:** exactly one, the super admin's alone, created idempotently by `ensureCoordinatorBot`. Default prompt `src/data/coordinator-system-prompt.ts`, backfilled only when empty.
- **Routes:** `/admin/bots` reopens the last visited bot (cookie `cobble_last_visited_bot_id`, never a workspace conversation) if still reachable, else coordinator (super admin) / latest bot / first workspace / empty. `/admin/bots/[bot_id]` conversation (header, thread and composer at 760px, no right panel); `/admin/bots/[bot_id]/models`; `/admin/workspaces/[id]` dashboard; `/admin/workspaces/[id]/bots/[bot_id]` same conversation scoped to the workspace.
- **Conversation loading:** pages render everything server-side (`grabConversationProps`) **except the history**, which the client loads (`api/admin/bots/conversation-history`, merged with what's already shown, refetched on bfcache restore) and pages older messages on scroll. Rail lists go through `railBots`/`railWorkspaces` (no prompts/memory, previews cut). While a reply is due the page polls `session-messages` (`use-reply-catch-up`) in case a push was missed.
- **Sending:** `api/admin/bots/send-message.ts` -> `enqueueBotReply` -> `wakeBotsQueue`. **Never import `src/bots-queue/index.ts` from a page or API route** (pulls the bunext runtime into page bundles). Optimistic bubble in `pending_messages` until the saved message replaces it.
- **Composer:** Tiptap editor reading/writing markdown, drafts in `localStorage`, `@` bots / `#` workspaces written as `[bot:ID]`/`[workspace:ID]`. Enter sends (Mod+Enter in lists/code). `@tiptap/react` needs `use-sync-external-store`; the app ships an ESM stand-in in `packages/use-sync-external-store-esm` (file dependency + override; the Dockerfile copies `packages/` before `bun install`).
- **Rendering:** markdown via `react-markdown` + `remark-gfm`, raw HTML never rendered, component map in `[bot_id]/(data)/message-markdown-components.tsx`. Inline refs, all linked by `link-computer-refs.ts` and rendered by chips in `(partials)/`: `[bot:ID]`, `[workspace:ID]`, `[computer:ID]`, `[file:ID]` (a saved file), `[folder:<volume>:<owner>:<path>]` (opens `/admin/files`), `[take-over:ID:mode]`, `[proposal:ID]`. Parsers in `src/utils/*-ref.ts`.
- **Replies/reactions:** `reply_to_message_id` (not an FK); reactions from the fixed `BotMessageReactions`, toggled by `react-message.ts` and the `react_to_message` tool, pushed as `server:bot-reaction`.
- **Attachments:** uploaded on pick (`upload-attachment.ts`, private `media`, text extracted when possible), linked via `bot_message_media`. Replies read files of the last `BotReplyAttachmentMessages` messages. Tasks don't get files yet.
- **Thinking row / stop:** `bot-busy-state.ts` decides the row's line and whether Stop shows. Stop (`api/admin/bots/stop.ts`, `stop-bot-jobs`) fails every open job of that bot for the user, aborts the running handler (`job-abort-registry`) and drops late face updates.
- **Voice:** mic -> `api/admin/bots/transcribe.ts`; play -> `GET speak-message` streamed into `<audio>`. Nothing recorded is stored. Both disabled with a note when the harness has no model.
- **Pictures:** `image_media_id` (private media, `bot-image`/`workspace-image`), via `set-profile-image.ts`, the `set_picture` tool or `update_workspace`. Bytes are **copied**, never moved; only picture-paradigm rows are deleted on replace. Format kept by `imageOutputFormat`.
- **Colour:** only `src/utils/bot-color.ts` resolves/validates colours and stones (`resolveBotColor`, `resolveBotStone`, `botColorNeedsPaperFace`); new bots get `pick-free-color.ts`.
- **Avatars:** `BotStone` draws the stone inline with the colour as SVG `fill` and the face as eyes. Coordinator: ink body, paper eyes. **Never put a stone in a circle/badge or add outline/shadow.** The wordmark is vector (`Wordmark`), never live text.
- **Copy helpers:** `src/utils/crew-status.ts`, `src/utils/relative-time.ts` (relative timestamps only).

### Prompt and memory

`composeBotPrompt` (`src/utils/compose-bot-prompt.ts`, via `grab-bot-prompt`): core `system_prompt`, install-wide append (`bot_system_prompt_append`), then in a workspace its context and the bot's instructions there, then core `memory`, per-user memory (`bot_user_memories`), workspace memory (`workspace_bots.memory`). Core memory is never about one user. `update_memory` defaults to `user` (`workspace` in a workspace); core only for what holds for everyone. Whole-text replace, capped at `AppData.PromptMaxLength`.

### Queue (`bots_queue`)

- Kinds (`BotJobKinds`): `reply` (chat answer, no task row) and `task` (long work, usually on a computer). bun-sqlite `isQueue` table. Helpers in `src/functions/backend/db/bots-queue/`: `enqueueBotJob`, `claimBotJobs` (kind-filtered atomic claim), `updateBotJob` (false once lost/cancelled), `completeBotJob`, `failBotJob` (backoff or fatal), `deferBotJob` (all models resting: attempt refunded, face `asleep`), `cancelBotJob`, `stop-bot-jobs`.
- Handler `src/bots-queue/index.ts`: separate reply/task slots, heartbeat, per-attempt deadline (`AppData.BotJobAttemptTimeoutMs`), one task per computer and one reply per session (`createKeyLock`). Work in `run-bot-job.ts` -> `run-bot-reply.ts` / `run-bot-task.ts`. Throw `BotJobFatalError` for failures retrying can't fix.
- Every model turn is a step in `bots_queue_updates` (tool names, never arguments; `describe-job-step.ts`, labels in `JobStepToolLabels`), pushed as `server:bot-job-update`.
- **Replies take in messages sent mid-run** (`incoming`, `IncomingMessagesNote`, redraft); separate requests are acknowledged with `send_message` (interim). A queued reply finishes silently only when a finished reply already read every user message (`hasUnansweredMessage`), never by who wrote last.

### Live updates

Server push only. `pushBotNotice` (`server:bot-message`, `server:bot-updated`), `pushBotUpdated` (to the bot's whole audience), `server:bot-created|removed`, `server:workspace-created|updated|removed`, `server:computer-updated`. Deletions push to the audience read **before** the delete. `liveRelay` (`src/live-relay/`) polls the DB every `AppData.LiveRelayPollMs` so work from other processes shows; clients dedupe by id. `useLiveBots` keeps rail and header current.

### Workspaces

`workspaces` (`description`, shared `system_prompt`, default `computer_id` (not an FK), `archived`), `workspace_bots` (per-bot instructions and memory there; coordinator is an implicit member), `workspace_computers`. First computer linked becomes the default. Workspace models win over a bot's own, then the defaults. Helpers in `src/functions/backend/db/workspaces/` are access-checked; structural ones are crew-manager only.

### Computers

- An AIO sandbox per docker container on `AppData.DockerNetworkName`, managed over the docker socket (`src/functions/backend/docker/`). `containers` records every container except the app's own. `createComputer` + background `provisionComputer` (status `creating` until the health check passes). Resource changes recreate the container.
- Only `/home/gem/workspace` is mounted, from `DATA_DIR/computers/<id>` (with `bots/`, `workspaces/`, marker `AppData.ComputerWorkspaceMarker`); the rest of home lives in the container. Deleting a computer keeps its directory. Outside docker (dev) containers are reached by IP (`pickReachableAddress`).
- One main computer (`ensureMainComputer`), whose coordinator grant is locked (`isLockedComputerAccess`). With `MAIN_COMPUTER_URL` set (dev) it isn't provisioned. Only super admins create/delete/retry computers.
- A bot's effective computers (`grab-bot-computers`): the workspace's in a workspace; otherwise direct grants plus its workspaces' (coordinator: all); `bots.computer_id` first. Only a `running` (healthy) computer is reached (`grabComputerMcpUrl` `ready`, `computerNotReadyMessage`).
- **Folders (enforced in tools, not a Linux user):** a run works only in `bots/<bot>/users/<user>` (cwd, `HOME`), `bots/<bot>` and `workspaces/<workspace>` (`computerRunDirs`, `withComputerDirs`, `resolveComputerPath`; `sudo` refused).
- **Viewing:** `/computers/<id>/` proxy (`handleComputerProxy`, strips app cookies, bridges websockets). `ComputerView` modes: browser, terminal, code, desktop (noVNC; the only one with Chrome's toolbar). **Take-over:** `ask_user_to_take_over` writes `[take-over:ID:mode]`; "Hand back" sends a chat message; tasks stop and report rather than wait.

### Schedules (routines in the UI)

`cron_jobs` per user and bot (`schedule` is a `Bun.cron` expression in UTC, `max_runs`, `next_run_at`, `last_error`). Helpers in `src/functions/backend/db/cron-jobs/` (ownership-checked). `nextCronRun` validates and enforces `AppData.CronJobMinIntervalMs`; max `AppData.CronJobMaxPerBot` per bot. `fireCronJob` claims a run atomically, skips while the last job is open, queues a task. A missed run runs once. Runs act on their own (`ScheduledRunNote`); `report_run_failed` retries with doubling backoff. `handOverCronJob` (tool `hand_over_schedule`, UI Hand over) moves a routine to another bot: a workspace routine stays in its workspace (`handOverPlace`), its computer is kept only if the new bot reaches it, refused while a run is open. UI: `/admin/routines` and each conversation's Schedules modal (shared `RoutineForm`/`RoutineRow`/`RoutineEditModal`, `HandOverForm`).

### Tasks (the to-do tracker)

`tasks` (one collection per bot or per workspace; exactly one of `bot_id`/`workspace_id`, enforced in `taskScopeValues` since SQLite unique treats NULLs as distinct), `task_notes`, `task_media` (deliverable|reference). Not the same as `bot_tasks`/`bots_queue` (those record jobs). Visibility SQL in `src/utils/task-access/`. Helpers in `src/functions/backend/db/tasks/`; tools `list_tasks`/`create_task`/`update_task`; API `api/admin/tasks/` (`userAuth` -> `isReadOnlyUser` -> `assertUserReachesTask` -> `safeErrorMessage`). UI in the workspace dashboard and the header's Tasks modal (shared components in `src/components/general/`). **Hand-over:** `handOverTask` (bot: `delegate_task` with `task_id`; UI: Hand over, crew managers) moves an open task to the new bot's list (a workspace's stays on its list and is worked there), sets it doing and queues a job with `params.tracker_task_id`; `noteTrackerTask` notes the job's end on it and blocks it on failure. **Not built yet:** task steps, `server:task-changed` pushes, a `/admin/tasks` page.

### Envs

Set in Settings > Environment (super admin), not `.env`. `envs` (private; encrypted `value`; `paradigm` general|workspace|computer|bot; one per key and scope, enforced in `saveEnv`). Cached per process. App settings (`EnvDict` in `src/dict/env-dict.ts`) via `grabEnv` (general value, else `process.env`); `ProcessOnlyEnvKeys` can't be saved. Precedence for runs: bot > computer > workspace > general (`resolveScopedEnvs`). Written to `~/.cobble/env` and `env.json` on the computer each run; bots see keys and descriptions, never values; every computer tool result goes through `redactSecrets`.

### PWA and notifications

- Generated assets (manifest, icons, `offline.html`, `loading.html`) come from `bun run gen:favicon`, which reads `main.css`; outputs are committed. Shared paths in `src/data/pwa-data.ts`.
- **Install name:** app setting `install_name` (Settings > General, super admin). `handlePwaFile` rewrites the manifest's `name`/`short_name` per request (`namePwaManifest`), the root head uses it for iOS tags, the loading page's `<title>` is the `{{name}}` placeholder. Devices pick up a new name only on reinstall.
- **Install icon:** app setting `install_icon` (JSON, `parseInstallIcon`): a stone, or an upload (decoded, cropped to `source.png`, never stored as sent, no SVG) with the stone at `PwaCornerMarkInset`/`PwaCornerMarkScale`, inside a round launcher's crop. `saveInstallIcon` draws the set (`renderInstallIcons`, shared with `gen:favicon` via `renderAppIcon`) into `DATA_DIR/install-icon/<version>/`, served publicly and `immutable` by `handleInstallIconFile`; the manifest, head links and push payloads point at it. Ember stone = stock icons, no set.
- Notification `badge` is `icons/badge-96.png` (white silhouette; Android masks by alpha, so never the opaque app icon). Brave on Android has no WebAPK, so its notifications always carry Brave's name and icon.
- `public/sw.js` is served `no-store`; navigations network-only (authenticated HTML never cached); `/api/`, `/ws`, `/media/`, `/computers/`, `/build-info.json` never intercepted. It never reloads on its own. In development the worker and caches are actively removed (`clear-development-service-worker.ts`, stub `/sw.js`).
- **Precache (production):** a navigation without the current build cookie gets `loading.html`, which downloads all of `.bunext/public` into `cobble-assets-<build_id>`, verifies, sets the cookie and reloads (falls back to network on stall). React knows nothing of this.
- Phone shell: rail is a slide-over below `md`; rail internals use the `@rail:` container variant, not viewport `lg:`. `LiveSocket` is remounted on online/pageshow/visibility since twui stops retrying after three attempts. Nothing is queued offline.
- **Web Push:** `push_subscriptions`, `user_presence`; VAPID keys generated into `envs` by `ensureVapidKeys`. `pushBotNotice` is the one trigger, skipped while the user is present (`AppData.PushPresenceWindowMs`, per user not per device). Best effort, no retry. Needs HTTPS.

### Bot files and folders

- Files live on the data volume, not on computers: `DATA_DIR/bots/<id>` and `DATA_DIR/workspaces/<id>`. Catalog `bot_files`, bytes in private `media` (`bot-file`) written by `recordBotFile`. Reach via `grabStorageScopes`; paths via `resolveBotPath` (no absolute, `..`, NUL, symlink escape); quota checked by `assertStorageRoom`.
- Tools in `src/harness/tools/storage/` (every run). `attach` puts a file on the reply. `grabConversationFiles` must list the **whole** folder tree, or nested `[file:ID]` refs render dead.
- `import_file` copies from a computer through the sandbox's streaming `GET /v1/file/download`, **never through its shell** (`/v1/shell/exec` caps output at ~30K chars and silently truncated imports). Size read first, `change_policy=abort`, length checked.
- Ingestion: chunks + embeddings into `bot_file_chunks` / `bot_file_vectors` (vec0), worked by `src/file-ingest/`; without an embedding model search falls back to words and says so. sqlite-vec limits: metadata columns are NOT NULL; side-car columns can't be filtered with `MATCH` (filter in code). **Never pass `--vector` to `bunx bun-sqlite schema` in `entrypoint.sh`** (wipes vectors on boot). Changing `AppData.EmbeddingDimensions` needs a manual `--vector` run and a re-ingest.
- **Foreign keys are off per connection** unless `enableForeignKeys` ran (only `src/server.ts` does). Scripts never fire `ON DELETE CASCADE`, so **any helper that deletes a parent row must delete its children explicitly** (as `deleteBotFile`, `purgeStorage`, `deleteSkill` do). A leftover child fails the next `bun run db:schema` with a foreign key violation.

### Files browser (`/admin/files`)

Read-only browser of every volume (`src/utils/storage-volumes.ts`: bots, workspaces, computers, media, mcp, db). `resolveStorageSpec` is the only access gate (members see only their bots' and their own user folders inside a computer, `computerPathAllowed`); `resolveStoragePath` applies the path rules. Links built only by `storageSpecHref`. Deletion stays in the chat's files modal and bot tools.

### Harness (the model layer, `src/harness/`)

- **Harnesses** (`src/dict/harness-dict.ts`): `text` (always on), `vision`, `transcription`, `speech`, `image`, `embedding`. One `harness_settings` row each (provider, pinned model or automatic, `fallback`, `enabled`, `options`). Transcription, speech and embedding have no automatic picks: unavailable until a model is picked.
- **Providers** (`src/dict/harness-provider-dict.ts`): OpenRouter default plus OpenAI-compatible ones; one adapter today (`src/harness/providers/openai-compatible/`). Keys encrypted in private `harness_providers`, falling back to the preset env.
- **Catalog:** `harness_models`, synced hourly. OpenRouter "free" means `:free` or `openrouter/free`, never zero prices. Auto picks: `rank-auto-models`.
- **Calling:** `resolveHarnessCandidates` -> `withCandidates` with process-wide cooldowns; errors are `HarnessError`. Entry points under `text/`, `media/`, `audio/`, `image/`, `embeddings/`. `run-text-loop.ts` sticks to one model, caps steps (`grabHarnessMaxToolSteps`, `grabReplyMaxToolSteps`), trims old tool output to fit context. Models that can't take an image/audio part get it read by vision/transcription first.
- **Per-bot models:** workspace row > bot row > default; the coordinator always uses the defaults. Every entry point takes `bot_id` and passes it on. Shared form `settings/models/(partials)/harness-settings-form.tsx`.
- **Tools:** `HarnessTool` built per run; own tools validate with zod. `run-tool-call.ts` reports errors back to the model and caps each call (`AppData.HarnessToolTimeoutMs`). Bot tools in `src/harness/tools/bot/` (memory, instructions, tasks, schedules, `start_task`, coordinator's crew management, `delegate_task` and `hand_over_schedule`, with results relayed back by `relayJobToRequester`).
- **Extensions:** MCP servers (`mcp_servers`, remote or stdio), custom tools (`custom_tools`: http, script, prompt) and skills (`skills`, runbooks loaded with `load_skill`). Given per bot / per workspace (`botExtensionsSql`); `all_bots` only decides what new bots get. Templates `{{args.x}}`/`{{env.KEY}}` via `fillTemplate`; secrets redacted from results. stdio servers run in a per-process pool. Skill body limits are app settings (`grabSkillBodyMaxChars`, `grabSkillBodyShownChars`).
- **Bots never add or repoint extensions or set envs.** The coordinator may only change what can't alter where data is sent (name, description, on/off, access). New skills, servers, tools, or changes to a URL, headers, kind, config or a skill's runbook go through `propose_*` -> `extension_proposals` -> `[proposal:ID]` card, which the app describes from the config itself (never from what the bot says) and the super admin confirms (`checkProposalData` re-checks). Stdio servers are never proposed by bots (they run in the app container, which holds the docker socket).
- **Check before and after acting** (`ActionCheckNote`): look for an existing record before creating one, verify every action took effect. Tools enforce it (read-back on memory saves, duplicate checks on bots, schedules, tasks, workspaces).

### Token usage

- Every model call writes a `token_usages` row via `record-harness-usage.ts` (never throws) in `withCandidates`'s `on_success`, with the provider/model that actually answered and the call's settings (`HarnessCallSettings`).
- Attribution through an `AsyncLocalStorage` scope (`src/harness/usage/harness-usage-scope.ts`) entered once in `run-bot-job.ts`; merged, not replaced; `null` clears a field. `withUsageScope` / `runWithFallbackScope` for calls outside a run. No owner, no row.
- `complete-bot-job.ts` back-fills `message_id` for the job's calls. Messages show `MessageUsageChip` and a details modal (`grabMessageDetails`).
- `/admin/usage` (crew managers). **Days are local, not UTC:** group with `date(created_at / 1000, 'unixepoch', 'localtime')`; never name a local day with `toISOString().slice(0, 10)` (`bucket-usage-days.test.ts` pins this). Bars use static `h-*` classes from `(data)/usage-bar-heights.ts`.

### Installer and release

- `install.sh` (`curl -fsSL https://url.moduletrace.com/cobble | sudo bash`) is the only install and update path; idempotent; `--uninstall [--purge]`. Never regenerates secrets; backs up the DB before replacing the container. Everything persistent lives in `$COBBLE_HOME/data` (default `/opt/cobble`).
- **Mount specs:** `source:destination[:options]`, options (`z`, `ro`) comma-separated in the **third** field. Never append an option to the destination (`$DATA_DIR:/data,z` mounts a directory literally named `/data,z` and loses all data on update). `install.test.ts` runs the marked `selinux-detection` and `mount-specs` blocks. `/data` must stay a bind mount (`resolveHostPath` maps it to host paths for computers).
- Plain HTTP only; TLS is the proxy's job. Container: `--network cobble`, `.env` read-only at `/app/.env`, docker socket, `MAIN_SERVER=1`, `--init`, `--cpus 1 --memory 2048m` by default.
- Publishing: `scripts/publish-github.sh` / `publish-gitea.sh` sharing `scripts/lib/publish-*.sh` (tested by `scripts/publish-tools.test.ts`). A GitHub release triggers `.github/workflows/release.yml` (amd64 + arm64 to `ghcr.io/moduletrace/cobble`); `mirror-gitea.sh` copies to `git.tben.me/moduletrace/cobble` (CI can't reach the VPN). **Bump `package.json`'s `version` with a release.** CI (`ci.yml`) runs typecheck and tests. Dockerfile pins Bun 1.4.3.

## Admin routes

`AdminSections`: `/admin/bots`, `/admin/workspaces`, `/admin/routines`, `/admin/logs`, `/admin/help`, `/admin/settings`. `/admin` -> `/admin/bots`. Every `/admin/*` page renders in the bots layout (`src/layouts/bots/`); there is no separate admin layout.

- **Rail pages** (`src/dict/rail-pages-dict.ts`): Routines, Files, Usage (crew managers), Activity (`/admin/logs`, super admin), Help (`(data)/help-topics.ts`). Visibility via `canSeeRailItem` for both the popover and the aside.
- **Settings** (`src/dict/settings-pages-dict.ts`; add a sub page = folder + dict entry): `general` (theme per device, plus super-admin app settings: prompt append, run limits, skill limits; crew-manager storage quota; running version), `profile`, `notifications`, `change-password`, `models`, `environment`, `backups` and `database` (super admin), `bots`, `workspaces`, `computers`, `mcps`, `tools`, `skills` (crew managers), `users` (`canListUsers`).
- Settings pages use `SettingsShell` (breadcrumbs via `admin-breadcrumbs.tsx`), `SettingsGroup` blocks (no cards) and the sticky `SettingsSaveBar`. Saves don't reload. Keep save notices in component state (`useFormInit` clears `status` on change). Lists share `SettingsList`/`SettingsListRow`/`SettingsRowAction`. Row actions are icon-only (`RowIconButton`).
- **Backups:** DB snapshots (synchronous) and whole-data archives of `DATA_DIR` into `BACKUP_ARCHIVE_DIR`. Archives and restores outlast a request, so the route only starts the run (`startDataBackupRun`, which holds `with-backup-run-lock.ts`) and the page polls `data-status`. A restore takes a safety archive first, then restarts the process.
- **Database browser:** strictly read-only; values cut in SQL; state in the address via `databaseHref`.
- Add flow (`(partials)/add-flow.tsx`) from the rail's Add icon: bot, workspace, computer (super admin). Page heroes use `AdminHero`.

## Page directory rules

Route-local code under `src/pages` goes in non-routed meta folders: `(sections)`, `(partials)`, `(data)`, `(functions)`, `(utils)`, `(hooks)`. Keep route files (`index.tsx`) thin. Dynamic routes `[param]`, catch-all `[[...paths]]`. Server functions in `index.server.ts` beside `index.tsx`.

## Shared code

- `src/hooks/` shared hooks; `src/functions/backend/` server-only (auth, db, email, logger); `src/functions/frontend/` client-safe handlers; `src/functions/server/` server utilities.
- `src/utils/` utilities (most with tests), `src/utils/rbac/` the RBAC engine.
- `src/dict/` dictionaries/constants; `src/data/` static data (`site-data.ts`, `app-data.ts` with every `AppData.*` constant); `src/types/`; `src/scripts/` CLI scripts; `src/schemas/` zod schemas.
- `src/components/general/`: shared components built on twui (`logo`, `logo-icon`, `wordmark`, `bot-stone`, `user-avatar`, `code-editor`, `computer-view`, `admin-hero`, `login-shell`, ...).

## UI and styling rules (MANDATORY)

- **Build UI with twui and `src/components/general/`.** Don't hand-roll HTML for layout, typography or controls. Layout: `Section`, `Container`, `Stack`, `Row`, `Center`, `Span`, `P`, `H1`-`H5`, `Button`, `Divider`, `Img`, `Link`, `ArrowedLink`, `Main`, `Header`, `Footer`, `Spacer`. Elements: `Card`, `Paper`, `Tag`, `HeaderNav`, `LinkList`, `Tabs`, `Table`, `Breadcrumbs`, `Modal`, `Dropdown`, `CheckBulletPoints`, `EmptyContent`, `Loading`, `LoadingBlock`, `Toggle`, `Toast`. Forms: `Form`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radios`, `SearchSelect`, `FileUpload`, `ImageUpload`.
- **UNCHANGEABLE: twui components always win over raw JSX elements** (`<h1>`, `<p>`, `<span>`, `<ul>`, `<li>`, `<img>`, `<a>`, `<button>`, `<div>`-as-card, ...). Never introduce one where a twui equivalent exists; override via `className`.
- **No new CSS classes, CSS files or inline `style={{...}}`.** Style only with component props, existing `twui-*` classes, semantic token utilities (`bg-paper`, `text-ink`, `border-hairline`, ...) and utilities already used in the codebase. Extend component code only when the API can't express the need.
- **Chunk classes with `twMerge`**, one chunk per claim: base first, one string per conditional, caller override last. Never concatenate conditional classes with template literals or `+`, never one long mixed string: `className={twMerge("w-full flex-col gap-0! rounded-default py-1", selected && "bg-ink/5")}`.
- **Theming:** colours, radii and fonts change only in `src/styles/main.css` (`:root`/`.dark` vars exposed as `paper`, `surface`, `sunken`, `ink`, `ink-secondary`, `ink-disabled`, `hairline`, `hairline-strong`, `on-ink`, `hue-<name>`, `shadow-popover`, `--m-fast/base/slow`). Never hardcode hex colours, radii or font stacks. Hues are bot identity only, never state.
    - **The one exception:** a bot's user-chosen colour reaches `BotStone` and `UnreadDot` as an SVG `fill` attribute. Nothing else may take a colour that way, and `src/utils/bot-color.ts` is the only place a colour string is validated.
- **Screenshots:** `docs/readme/{hero,workspace}-{light,dark}.png` are real screenshots (1440px at 2x, downscaled to 1600px). Retake them from a seeded dev instance when the UI changes, same names. Never use handoff screens.
- **Logo:** `public/logos/logo.svg` is the single source; after changing it run `bun run gen:favicon`.
- **Site name:** interpolate `SiteData["SiteName"]` in titles, emails and copy; never hardcode the brand.

## Conventions

- One function/component per file.
- **Modularization is non-negotiable.** Repeated UI blocks become reusable prop-driven components.
- **Every rendered array item is its own component:** `items.map((item) => <Item {...item} />)`, never inline JSX in the map.
- **No em dashes (U+2014) anywhere** (code, comments, docs, copy). Use `-` or restructure.
- Always object parameters (`{ foo, bar }`), never positional.
- Prefer existing patterns over new abstractions.
- **Do not patch `@moduletrace/twui`** (shared, publishable). Compose in `src/components/general/` or `main.css`.
- `.env` (secrets, gitignored, dockerignored) and `secrets/` are never committed. `external/` binary dirs are gitignored.
- **Rate limit** unauthenticated endpoints that check secrets or send email (`src/utils/rate-limit.ts`).
- **Validate** untrusted bodies with `src/schemas/` via `parseWithSchema`. Throw `AppError` for safe messages; catch blocks return `safeErrorMessage`.
- **HTML columns** accepting user input: sanitize with `sanitizeRichTextHtml` (or `sanitizeUserBio`) before storing or `dangerouslySetInnerHTML`.
- **Email outside production** goes through `resolveEmailRecipient` (to `DEV_EMAIL_RECIPIENT`). Never hardcode recipients.
- **Never trust ids from the request body for ownership or sessions.** Use the session `user.id` and the `src/utils/rbac/` helpers.
- Any helper deleting a parent row deletes its children explicitly (foreign keys are off outside the server process).
- **Keep this file current, and short:** when you change something it describes, update the line; add new rules and gotchas, not inventories of helper names.
