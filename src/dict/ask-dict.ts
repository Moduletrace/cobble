/**
 * Where one bot's request to another stands. Every status but `pending`,
 * `working` and `answered` means the asking bot has been told, or is about
 * to be, why there is no answer.
 */
export const AskStatuses = [
    {
        title: "Pending review",
        value: "pending",
    },
    {
        title: "Working",
        value: "working",
    },
    {
        title: "Answered",
        value: "answered",
    },
    {
        title: "Refused",
        value: "refused",
    },
    {
        title: "Failed",
        value: "failed",
    },
    {
        title: "Stopped",
        value: "stopped",
    },
] as const;

export type AskStatus = (typeof AskStatuses)[number]["value"];

export const AskStatusValues = AskStatuses.map((status) => status.value) as [AskStatus, ...AskStatus[]];

/**
 * The coordinator's decisions on a request. `redirect` names the bot it
 * should have gone to; `refuse` only says why.
 */
export const AskDecisions = [
    {
        title: "Approve",
        value: "approve",
    },
    {
        title: "Redirect",
        value: "redirect",
    },
    {
        title: "Refuse",
        value: "refuse",
    },
] as const;

export type AskDecision = (typeof AskDecisions)[number]["value"];

export const AskDecisionValues = AskDecisions.map((decision) => decision.value) as [
    AskDecision,
    ...AskDecision[],
];

/**
 * The stages of a request's jobs, in `bots_queue.params`.
 */
export const AskStages = {
    review: "review",
    answer: "answer",
} as const;

export type AskStage = (typeof AskStages)[keyof typeof AskStages];

/**
 * The title of a request's gate job, on the coordinator's queue row.
 */
export const AskReviewJobTitle = "Crew request review";

/**
 * The title of the asked bot's job, on its queue row.
 */
export const AskAnswerJobTitle = "Crew request";

/**
 * App settings: how many days finished requests are kept, and how many
 * requests one place keeps (`AppData.AskKeepDays`, `AskMaxPerPlace`).
 */
export const AskKeepDaysSettingKey = "ask_keep_days";
export const AskMaxPerPlaceSettingKey = "ask_max_per_place";