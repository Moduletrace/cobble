/**
 * `last_error` of a job the user cancelled. Cancelled jobs are `failed`
 * (bun-sqlite queues have no cancelled status) with this error.
 */
export const BotJobCancelledError = "Cancelled";

/**
 * `last_error` bun-sqlite sets when it releases a job whose handler went
 * silent past the lock timeout on its last attempt.
 */
export const BotJobLockTimedOutError = "Lock timed out";

/**
 * What a queued job is. A `task` is long-running work with a row in the
 * working-on panel; a `reply` answers the user's latest messages in chat.
 */
export const BotJobKinds = [
    { title: "Task", value: "task" },
    { title: "Reply", value: "reply" },
] as const;

export type BotJobKind = (typeof BotJobKinds)[number]["value"];

/**
 * A reply job's title, and the bot's status line while it runs. The chat
 * shows a thinking row while a bot has it.
 */
export const BotReplyJobTitle = "Thinking";

/**
 * The bot's status line while its job waits for a rate-limited model.
 */
export const BotWaitingStatusLine = "Waiting for a free model";
