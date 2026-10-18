/**
 * Bot identity hues. A bot keeps its hue for life; a hue never means state.
 * The coordinator has no hue.
 */
export const BotHues = [
    {
        title: "Ember",
        value: "ember",
    },
    {
        title: "Amber",
        value: "amber",
    },
    {
        title: "Moss",
        value: "moss",
    },
    {
        title: "Teal",
        value: "teal",
    },
    {
        title: "Cobalt",
        value: "cobalt",
    },
    {
        title: "Violet",
        value: "violet",
    },
    {
        title: "Rose",
        value: "rose",
    },
] as const;

export type BotHue = (typeof BotHues)[number]["value"];

export const BotKinds = [
    {
        title: "Worker",
        value: "worker",
    },
    {
        title: "Coordinator",
        value: "coordinator",
    },
] as const;

export type BotKind = (typeof BotKinds)[number]["value"];

/**
 * A bot's face is its status. There are no badges or spinners.
 */
export const BotFaces = [
    {
        title: "Idle",
        value: "idle",
    },
    {
        title: "Working",
        value: "working",
    },
    {
        title: "Done",
        value: "done",
    },
    {
        title: "Asleep",
        value: "asleep",
    },
    {
        title: "Needs you",
        value: "needs-you",
    },
] as const;

export type BotFace = (typeof BotFaces)[number]["value"];

export const BotMessageAuthors = [
    {
        title: "Bot",
        value: "bot",
    },
    {
        title: "User",
        value: "user",
    },
] as const;

export type BotMessageAuthor = (typeof BotMessageAuthors)[number]["value"];

export const BotTaskStatuses = [
    {
        title: "Active",
        value: "active",
    },
    {
        title: "Done",
        value: "done",
    },
] as const;

export type BotTaskStatus = (typeof BotTaskStatuses)[number]["value"];

export const BotTaskStepStates = [
    {
        title: "Done",
        value: "done",
    },
    {
        title: "Active",
        value: "active",
    },
    {
        title: "Pending",
        value: "pending",
    },
] as const;

export type BotTaskStepState = (typeof BotTaskStepStates)[number]["value"];
