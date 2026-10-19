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
 * A `bots_queue_updates` row: a model turn that called tools, or one that
 * only wrote text.
 */
export const BotJobUpdateKinds = [
    { title: "Tool", value: "tool" },
    { title: "Note", value: "note" },
] as const;

export type BotJobUpdateKind = (typeof BotJobUpdateKinds)[number]["value"];

/**
 * A reply job's title, and the bot's status line while it runs. The chat
 * shows a thinking row while a bot has it.
 */
export const BotReplyJobTitle = "Thinking";

/**
 * The bot's status line while a task runs. Everyone who sees the bot sees
 * it, so it never names the task: each user sees their own task's title
 * and steps in their conversation.
 */
export const BotTaskStatusLine = "Working on a task";

/**
 * The status line while a bot waits on the user its job is for.
 */
export const BotNeedsYouStatusLine = "Waiting on you";

/**
 * The bot's status line while its job waits for a rate-limited model.
 */
export const BotWaitingStatusLine = "Waiting for a free model";

/**
 * The bot's status line while its task waits for another job on the same
 * computer to finish.
 */
export const BotComputerBusyStatusLine = "Waiting for its computer";

/**
 * How a job step that called a tool reads in the chat's working row, by
 * tool name. Tools not listed read "Using <name>".
 */
export const JobStepToolLabels: Record<string, string> = {
    sandbox_execute_bash: "Running a command",
    sandbox_execute_code: "Running code",
    sandbox_read_file: "Reading a file",
    sandbox_write_file: "Writing a file",
    sandbox_file_operations: "Working with files",
    search_computers: "Searching the computers",
    ask_user_to_take_over: "Asking you to take over",
    start_task: "Starting a task",
    delegate_task: "Handing work to the crew",
    assign_computer: "Changing computer access",
    update_memory: "Updating memory",
    update_instructions: "Updating instructions",
};

/**
 * Labels for whole families of tools, by name prefix.
 */
export const JobStepToolPrefixLabels: Record<string, string> = {
    browser_: "Using the browser",
};
