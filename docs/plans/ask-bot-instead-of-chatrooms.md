# Plan: replace chatrooms with a reviewed `ask_bot`

Status: proposed (not started)
Owner: maintainer
Scope: remove the chatroom feature; replace `ask_crew` with a gated `ask_bot`

## Goal

A worker that needs something from another bot calls `ask_bot` with a target and a brief.
The coordinator reviews the request in **one turn, no tools**, and answers with a bounded
JSON decision: approve, redirect to another bot, or refuse with reasons. Approved requests
go to the target as a normal reply job; the target's answer comes back to the asking bot's
session as a fenced crew message that wakes it. Refusals and redirects bounce back the same
way. All multi-turn orchestration, the room entity, the room pages and the three coordinator
tools go away.

What does not change: `delegate_task` (coordinator and workspace admins, downward),
`hand_over_task` (worker, its own task only), and the rule that a worker directs no peer.

## Decisions

Recorded here so they are not relitigated mid-implementation.

1. **The gate has three outcomes, not two.** `approve | redirect | refuse`. `redirect` names
   a reachable bot and a reason. Without it, a wrong `target_bot_id` is a wasted round trip and
   the asker's routing guess becomes the system's failure mode. The redirect costs nothing
   extra in the same turn.
2. **A target's non-answer is not a new state.** When the target replies "I do not have that",
   that text is the answer. Status `answered`. No `declined` state: the asker reads the text
   and decides. This keeps the machine at six states.
3. **Informational asks are gated too.** Gate everything, keep the gate cheap (one small turn,
   no tools), instrument it. If the gate turns are mostly approving trivial reads, split by class
   later with data. Do not pre-emptively trust the asker's own classification.
4. **Hidden sessions stay.** The room is currently the owner of the target's hidden session.
   That machinery survives as `bot_sessions.ask_id`. "Delete chatrooms" means delete the room as
   an entity, not delete the isolation mechanism.
5. **No `/admin/asks` page.** Requests and outcomes appear in the asking bot's session as messages,
   as they do today. The ask row exists for caps, depth, dedupe, usage attribution and pruning,
   not for a UI. A chip can be added later without a schema change.
6. **The gate fails closed.** If the coordinator's decision cannot be parsed after one retry, the
   ask fails with "couldn't review". A gate that approves on a garbled answer is not a gate.
7. **Rules of engagement split.** Judgement ("is this within what the user asked for", "is this the
   right bot") goes in the coordinator's instructions, global and per workspace. Hard rules stay in
   code: reach, workspace membership, depth, open caps, no asks from hook calls or routines,
   read-only and revoked users.

## The model

New table `bot_asks`:

| column | type | notes |
| --- | --- | --- |
| `id` | integer pk | |
| `user_id` | integer fk users | the user the run works for |
| `requester_bot_id` | integer fk bots | the worker asking |
| `target_bot_id` | integer fk bots | set by the tool, rewritable by a redirect |
| `workspace_id` | integer fk workspaces | null outside a workspace |
| `origin_session_id` | integer fk bot_sessions | where the outcome goes back |
| `parent_ask_id` | integer | the ask this one was asked from, if any (depth) |
| `title` | text | short label |
| `request` | text | the brief, markdown |
| `status` | text | see lifecycle |
| `gate_note` | text | the coordinator's reason, on approve, redirect and refuse |
| `outcome` | text | the target's answer, or why there is none |
| `session_id` | integer fk bot_sessions | the hidden session the target works in |
| `job_id` | integer | the target's job, so Stop can cancel it |
| `created_at` / `updated_at` | integer | |

Indexes: `(user_id, status)`, `(requester_bot_id, status)`, `(target_bot_id)`.

Schema changes beside it:

- `bot_sessions.ask_id` becomes the hidden-session marker, replacing `chatroom_id`.
- `bot_sessions.status` gains `ask`, replacing the `chatroom` value (`src/dict/bot-dict.ts:243`).
- `bot_messages.from_ask_id` replaces `from_chatroom_id` (`db/schema.ts:602-603`).

## Lifecycle

```
pending  --refuse-->  refused
   |                   (outcome = reasons, wake asker)
   |--approve/redirect-->  working  --answer-->  answered   (outcome = the answer, wake asker)
                                  \--fail---->  failed     (outcome = why, wake asker)
pending|working --stop-->  stopped                          (only tells the asker)
```

Six states, one wake per terminal state. Compare with `ChatroomStatuses` plus
`coordinator_turns`: the turn counter goes away entirely.

## Flow

1. A calls `ask_bot({ target_bot_id, title, request, separate? })` during a reply or a task run.
2. `askBotTool` (`src/harness/tools/bot/ask-bot-tool.ts`) checks, in this order:
   - the run is not a hook call and not a routine,
   - the target is in `chatroomAskableBots` (`grabCrewAsks` after rename) for this user and place,
   - depth: `parent_ask_id` chain below `AppData.AskMaxDepth`,
   - caps: fewer than `AppData.AskMaxOpenPerBot` open asks for this asker,
   - dedupe: no other open ask to the same target unless `separate`.
3. It inserts `bot_asks` with status `pending`, then `enqueueAskReview` queues one
   `kind: "reply"` job for the coordinator in a hidden ask session, with `params: { ask_id, stage: "review" }`.
4. The coordinator's job runs `reviewAsk` instead of the text loop. One model call, no tools,
   `BotAskDecisionSchema`, system prompt from `composeBotPrompt` for the coordinator in that
   workspace (so per-workspace rules apply) plus `AskRulesNote`.
5. `applyAskDecision`:
   - `refuse`: status `refused`, `gate_note = reason`, outcome message to the origin session, wake A.
   - `redirect`: validate the new target against the askable list, set `target_bot_id`,
     `gate_note = reason`, then continue as approve.
   - `approve`: status `working`, `ensureAskSession` for the target, the request inserted there as a
     crew message fenced by `AskRequestNote`, queue the target's reply job with
     `params: { ask_id, stage: "answer" }`.
6. The target's job is a normal reply run in its hidden session, with the normal tools. Its last
   message is the answer (`answerNotSentNote` already guarantees only the last message is sent).
7. `onAskJobEnded`, called from `complete-bot-job.ts` and `fail-bot-job.ts`:
   - reads the job's final message, runs `shareAskFiles` over it (copies `[file:ID]` and folder refs
     the asker cannot reach into A's folder, repointing the refs),
   - status `answered` or `failed`,
   - `askOutcomeMessage` posts it into `origin_session_id` as a user-side crew message with
     `from_ask_id`, fenced for the model, shown as coming from the coordinator,
   - wakes A.
8. `stopAsk` / `stop-bot-jobs` cancels the target's job and marks `stopped`.

Depth: when the target itself calls `ask_bot`, `parent_ask_id` is its session's `ask_id`, so
A -> B -> C is capped by `AskMaxDepth` exactly as `ChatroomMaxDepth` did.

## The gate contract

```ts
// src/bots-queue/bot-ask-decision-schema.ts
export const BotAskDecisionSchema = z.object({
    decision: z.enum(["approve", "redirect", "refuse"]),
    target_bot_id: z.number().int().optional(), // required with redirect, must be askable
    reason: z.string().trim().min(1).max(600),
});
```

`reviewAsk` mirrors `planBotTask` (`src/bots-queue/plan-bot-task.ts`): one turn, no tools, a
JSON-only instruction in `AskRulesNote`, `parseAskDecision` with one retry, then a failed ask.
The system prompt is the coordinator's own, so the provider cache serves it and the call is cheap.

Gate input, in the user turn: asker name, id and role; target name, id, role and description;
the workspace; the user and their role there; the askable bots; the open asks for that asker;
the title and the brief. Do not send the asker's transcript.

## Files

### Add

- `db/schema.ts` changes (see model) plus `db/types/db.ts` regenerated.
- `src/dict/ask-dict.ts`: `AskStatuses`, `AskOutcomeStatuses`, `AskReviewJobTitle`, setting keys.
- `src/data/app-data.ts`: `AskMaxOpenPerBot`, `AskMaxDepth`, `AskKeepDays`, `AskKeepDaysMax`,
  `AskMaxPerPlace`, `AskMaxPerPlaceMax`, `AskSharedFilesMax`, `AskReasonMaxChars`, replacing the
  `Chatroom*` block at lines 354-384.
- `src/functions/backend/db/asks/`:
  `create-ask.ts`, `grab-ask.ts`, `grab-user-asks.ts`, `grab-crew-asks.ts`, `ensure-ask-session.ts`,
  `enqueue-ask-review.ts`, `enqueue-ask-answer.ts`, `apply-ask-decision.ts`, `close-ask.ts`,
  `on-ask-job-ended.ts`, `cancel-ask-jobs.ts`, `share-ask-files.ts`, `ask-outcome-message.ts`,
  `ask-ancestry.ts`, `prune-asks.ts`, `prune-asks-sql.ts`, `stop-ask.ts`, `grab-ask-depth.ts`.
- `src/functions/backend/db/asks/migrate-chatrooms-to-asks.ts` (see Migration).
- `src/bots-queue/review-ask.ts`, `src/bots-queue/bot-ask-decision-schema.ts`,
  `src/bots-queue/parse-ask-decision.ts`, each with a colocated test.
- `src/harness/tools/bot/ask-bot-tool.ts` and `ask-bot-tool.test.ts`.
- `src/utils/ask-status-line.ts` (the thinking row while an ask is pending), `src/utils/merge-ask.ts`
  (push merge, replacing `merge-chatroom.ts`), `src/utils/can-retry-ask.ts`, `src/utils/ask-retry-note.ts`.
- `src/functions/backend/db/usage/grab-ask-usage.ts` (replaces `grab-chatroom-usage.ts`).

### Change

Session visibility, the single most important group. `chatroom_id IS NULL` is hand-written in
11 files. Replace all of them with one shared fragment (`visibleSessionSql` in
`src/functions/backend/db/bot-sessions/`) to stop the next marker from drifting the same way:

- `src/bots-queue/run-bot-reply.ts:204,252,423`
- `src/functions/backend/db/bot-sessions/grab-bot-sessions.ts`
- `src/functions/backend/db/bot-sessions/grab-past-session-messages.ts`
- `src/functions/backend/db/bot-sessions/past-session-messages-sql.ts`
- `src/functions/backend/db/bot-sessions/is-hidden-session.ts` (add the `ask` status)
- `src/functions/backend/db/bots/grab-bots.ts`
- `src/functions/backend/db/bots-queue/count-open-bot-jobs.ts`
- `src/functions/backend/db/bots-queue/grab-running-bot-job-face.ts`
- `src/functions/backend/db/workspaces/grab-user-workspaces.ts`
- `src/functions/backend/db/workspaces/grab-workspace-activity.ts`
- `src/live-relay/relay-changed-sessions.ts:26`

Queue dispatch and lifecycle:

- `src/bots-queue/run-bot-job.ts:55` - branch on `params.ask_id` and `stage` instead of
  `bot.kind == "coordinator" && params.chatroom_id`.
- `src/bots-queue/index.ts` - no new job kind; `stage` in `params`.
- `src/functions/backend/db/bots-queue/complete-bot-job.ts`, `fail-bot-job.ts` - call
  `onAskJobEnded`.
- `src/functions/backend/db/bots-queue/stop-bot-jobs.ts` - call `stopAsk`.
- `src/functions/backend/db/bots/insert-bot-message.ts` - `from_ask_id`, `is_crew_message`.
- `src/utils/is-crew-message.ts`, `src/utils/conversation-markdown.ts`.

Tools and prompts:

- `src/harness/tools/bot/grab-bot-tools.ts` - `ask_bot` instead of `ask_crew`.
- `src/harness/tools/bot/grab-bot-chat-tools.ts` - `onChatroom` becomes `onAsk` (or is dropped).
- `src/harness/tools/bot/grab-bot-chat-tools.test.ts` - expectations.
- `src/data/harness-prompts.ts` - delete `chatroomCoordinatorNote` (line 669); add `AskRulesNote`
  (the gate's decision rules), `AskRequestNote` (fenced brief for the target) and
  `AskOutcomeNote` (what A reads).
- `src/data/coordinator-system-prompt.ts` - describe the gate and the rules of engagement.
- `src/dict/bot-types-dict.ts:86-89` - comment only; the matrix does not change.

Live relay and UI:

- `src/live-relay/index.ts`, `src/live-relay/relay-new-bot-messages.ts`
  - `server:chatroom-message` becomes `server:ask-message`.
- `src/pages/admin/bots/[bot_id]/(sections)/conversation.tsx` - drop `useConversationChatrooms`,
  `chatroomHoldsReply`, the context provider (or keep the context, emptied).
- `src/pages/admin/bots/[bot_id]/(partials)/message-thread.tsx` - drop
  `ConversationChatroomStatus` in the thread.
- `src/pages/admin/bots/[bot_id]/(partials)/crew-message-line.tsx` - drop the chatroom context.
- `src/pages/admin/bots/[bot_id]/(utils)/ref-chip-for-href.tsx` - drop `ChatroomRefChip`.
- `src/utils/link-refs-in-text.ts`, `src/utils/link-computer-refs.ts`,
  `src/utils/link-computer-refs.test.ts` - drop the `[room:ID]` parser and test.
- `src/layouts/bots/(partials)/rail-crew-list.tsx:58`, `rail-workspace-list.tsx:89` - drop the
  chatrooms section.
- `src/utils/is-pages-rail-path.ts` and its test.
- `src/dict/admin-sections-dict.ts:8` - drop `/admin/chatrooms`.
- `src/dict/general-settings-dict.ts:194-202` - the chatrooms group becomes asks retention
  (`asks_keep_days`, `asks_max_per_place`).
- `src/dict/bot-dict.ts:243` - `chatroom` becomes `ask`.
- `src/pages/api/admin/bots/message-trace.ts`, `src/pages/api/admin/bots/files.ts` - the chatroom
  room check becomes the ask check.
- `src/server.ts` - register `migrateChatroomsToAsks` beside `migrateBotTypes` (line 42).
- `AGENTS.md` - the chatroom section, the `ask_crew` references, the rail and settings lists.

### Delete

Pages and API:

- `src/pages/admin/chatrooms/` (all: `index.tsx`, `index.server.ts`, `(hooks)/use-live-chatrooms.ts`,
  `(partials)/chatroom-list-row.tsx`, `(sections)/chatrooms-list.tsx`)
- `src/pages/admin/chatrooms/[chatroom_id]/` (all 16 files: `index.tsx`, `index.server.ts`, and
  everything under `(functions)`, `(hooks)`, `(partials)`, `(sections)`)
- `src/pages/admin/workspaces/[workspace_id]/chatrooms/` (4 files)
- `src/pages/api/admin/chatrooms/` (4 routes) and `src/pages/api/admin/settings/chatroom-retention.ts`
- `src/pages/admin/settings/general/(partials)/chatroom-retention-form.tsx`,
  `(sections)/chatroom-retention-section.tsx`
- `src/pages/admin/bots/[bot_id]/(hooks)/use-conversation-chatrooms.ts`,
  `(data)/conversation-chatrooms-context.ts`,
  `(partials)/conversation-chatroom-row.tsx`,
  `(partials)/conversation-chatroom-status.tsx`,
  `(partials)/chatroom-ref-chip.tsx`,
  `(utils)/chatroom-holds-reply.ts`
- `src/layouts/bots/(hooks)/use-rail-chatrooms.ts`,
  `(partials)/rail-chatroom-row.tsx`, `(partials)/rail-chatrooms-section.tsx`
- `src/components/general/chatroom-retry-button.tsx`, `chatroom-stone.tsx`,
  `chatroom-stones.tsx`, `chatroom-stone-cluster.tsx`

Server and queue:

- `src/functions/backend/db/chatrooms/` (all 31 files)
- `src/bots-queue/run-chatroom-turn.ts`, `src/bots-queue/chatroom-turns.ts` and its test
- `src/harness/tools/chatroom/` (4 files)

Usage, pruning, relay, dict, utils:

- `src/functions/backend/db/usage/grab-chatroom-usage.ts`, `chatroom-usage-sql.ts`, its test
- `src/functions/backend/db/app-settings/grab-chatroom-retention.ts`
- `src/cron/prune-chatrooms/index.ts` (and its registration in `src/cron/index.ts`)
- `src/live-relay/relay-changed-chatrooms.ts`
- `src/functions/frontend/retry-chatroom-request.ts`
- `src/dict/chatroom-dict.ts`
- `src/utils/`: `chatroom-ref.ts`, `chatroom-href.ts`, `chatroom-status-line.ts`,
  `chatroom-bot-statuses.ts`, `chatroom-open-jobs-warning.ts`, `chatroom-retry-note.ts`,
  `chatroom-in-place.ts`, `chatroom-in-conversation.ts`, `can-retry-chatroom.ts`,
  `merge-chatroom.ts`, and every matching `*.test.ts`

## Migration

`migrateChatroomsToAsks`, run at boot from `src/server.ts`:

1. If `bot_asks` is missing, return (a fresh install has nothing to move).
2. Delete the room side: `bots_queue` rows whose session is a room's, `bot_job_traces` for those
   jobs, `bot_messages` for those sessions, then `bot_sessions` where `chatroom_id IS NOT NULL`.
   Room history has no owner once the entity is gone.
3. Delete the outcome notices in normal sessions: `bot_messages.from_chatroom_id IS NOT NULL`.
   They are transient notices that quote a room link which would render dead. Their text is
   already in the asking bot's history as the crew message it answered, so nothing of substance is
   lost. Do this before step 4.
4. `DROP INDEX IF EXISTS idx_bot_sessions_chatroom_id`, then `ALTER TABLE bot_sessions DROP COLUMN chatroom_id`,
   `DROP TABLE IF EXISTS chatrooms` (drop the child column first: SQLite cannot drop a parent table
   while a foreign key points at it).
5. Wrap 2 to 4 in a transaction and tolerate a `DROP COLUMN` failure with a logged warning: if the
   bundled SQLite refuses, the column stays, always NULL, and is harmless because no code reads it.
6. `bun run db:schema` regenerates `db/types/db.ts`. Do not pass `--vector` (it wipes embeddings).

Rollback: the schema is additive except for the three drops. Keep the migration idempotent and
guarded by a version row in `app_settings` (`asks_migrated`), so a second boot is a no-op.

## Verification

- `bun run typecheck`.
- `bun run test`, with new tests for: the decision parser (approve, redirect to a non-askable bot,
  refuse, garbage, garbage twice), the depth chain, the open cap and the dedupe, `shareAskFiles`,
  `pruneAsksSql`, `onAskJobEnded` for answered and failed, and `migrateChatroomsToAsks` on a
  fixture with a room, its sessions, messages and jobs.
- Regression tests that the session lists never show an ask session: one per entry point that used
  `chatroom_id IS NULL`, now reading `visibleSessionSql`.
- Production build, then `bun run check:bundle` (deleting pages must not raise the conversation
  page's budget).
- Browser check through the Playwright MCP at `http://localhost:8931/mcp`: seed two bots and the
  coordinator, have A ask B for a file, watch A get woken, and have the gate refuse a bad request
  and redirect a mis-addressed one. Screenshots to `.tmp/`, deleted after.
- `read_settings`/usage: an ask's model calls must appear in `/admin/usage`, proving attribution
  survived the `chatroom_id` -> `ask_id` swap.

## Phases

1. **Schema and asks module.** Table, dict, constants, `create-ask`, `ensure-ask-session`,
   `close-ask`, `on-ask-job-ended`, the gate (`review-ask`, schema, parser), queue dispatch.
   Nothing user-facing switches yet. Typecheck and unit tests green.
2. **Tool and rules.** `ask_bot`, `grabBotTools` wiring, the three prompt notes, coordinator
   system prompt, caps and dedupe. `ask_crew` and `createChatroom` stay in place behind the old
   tool until phase 3, so both paths can be compared on the seeded instance.
3. **Remove the old path.** Delete chatrooms (every list above), the `[room:]` ref, the rail
   section, the pages, the settings, the cron, the relay, the usage helper. Rewrite the session
   visibility filters onto `visibleSessionSql` in one commit so a missed filter is visible.
4. **Migration and cleanup.** Boot migration, `db:schema`, `AGENTS.md`, tests, bundle check,
   browser pass.

Each phase ends with `bun run typecheck` and `bun run test`, and nothing is committed until asked.

## Risks

- **A missed hidden-session filter.** Eleven files hand-write `chatroom_id IS NULL`. One miss leaks
  crew traffic into a user's rails. Mitigation: `visibleSessionSql` in phase 3, before deleting the
  old column, plus one test per entry point.
- **The gate is a single point of failure.** Every ask now depends on the coordinator's model and
  queue. An install with a resting coordinator model refuses every ask. Mitigation: the gate uses
  the same candidate fallback as any call; `failed` says "couldn't review, try again"; the fallback
  chain is visible on the ask's usage row.
- **Latency and cost.** One extra model call per ask, on a small prompt. Measure before phase 3
  with usage rows; if it dominates, split informational asks.
- **Bots over-asking.** With no room to read, a bot may ask instead of reading its own files.
  `AskRulesNote` must say the asker should have what it needs locally first, and the cap plus the
  gate's refusal cover the rest.
- **Depth regressions.** Removing the coordinator's multi-turn routing means the depth chain now
  goes through `parent_ask_id` only. Test the two-hop case explicitly.

## Deferred

- An "ask" row under the asking bot's message (a `MessageAskChips` beside `MessageTaskChips`).
- A read-only `/admin/asks` list, if the message view proves insufficient.
- Splitting informational asks out of the gate, once usage data exists.
- `ask_bot` with more than one target in one call (the gate would pick). Not worth it yet.