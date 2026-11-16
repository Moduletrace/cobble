/**
 * Where a plan stands. A bot writes one as `planned` and the user approves
 * it on its card, which makes it `active`: from there the bot works one
 * step at a time and reports each (`complete_plan_step`). `paused` stops it
 * where it is until the user resumes it, `done` is every step finished or
 * skipped, and `cancelled` is a plan nobody carries on.
 */
export const BotPlanStates = [
    {
        title: "Waiting for you",
        value: "planned",
    },
    {
        title: "In progress",
        value: "active",
    },
    {
        title: "Paused",
        value: "paused",
    },
    {
        title: "Done",
        value: "done",
    },
    {
        title: "Cancelled",
        value: "cancelled",
    },
] as const;

export type BotPlanState = (typeof BotPlanStates)[number]["value"];

/**
 * The states a plan can still be worked in: only one of them is open in a
 * conversation at a time.
 */
export const BotPlanOpenStates: BotPlanState[] = ["planned", "active", "paused"];

/**
 * A step of a plan: it waits, it's done (with a line on what it produced),
 * or it was skipped (the work made it unnecessary).
 */
export const BotPlanStepStates = [
    {
        title: "Done",
        value: "done",
    },
    {
        title: "Skipped",
        value: "skipped",
    },
    {
        title: "Pending",
        value: "pending",
    },
] as const;

export type BotPlanStepState = (typeof BotPlanStepStates)[number]["value"];

/**
 * The states the user sets from a plan's card: approve it, pause it or end
 * it. `done` is the app's own call, set when the last step is finished.
 */
export const BotPlanSettableStates: BotPlanState[] = ["active", "paused", "cancelled"];