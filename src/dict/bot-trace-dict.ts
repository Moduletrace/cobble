/**
 * A `bot_job_traces` row: what a run did in detail, behind the debug view.
 * One row per turn, tool call and loop event, kept beside the one-line
 * steps the conversation's working row reads (`bots_queue_updates`).
 */
export const BotTraceKinds = [
    { title: "Turn", value: "turn" },
    { title: "Tool call", value: "tool" },
    { title: "Event", value: "event" },
] as const;

export type BotTraceKind = (typeof BotTraceKinds)[number]["value"];

/**
 * The app setting (Settings > General) for how many days a run's trace is
 * kept, else `AppData.BotTraceKeepDays`.
 */
export const BotTraceKeepDaysSettingKey = "bot_trace_keep_days";