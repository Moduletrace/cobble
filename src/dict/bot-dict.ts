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
 * Every user has exactly one coordinator, created with the account. It
 * coordinates the crew and hands work to the other bots.
 */
export const CoordinatorBotName = "Coordinator";

/**
 * The `app_settings` key holding the install-wide text appended to every
 * bot's prompt, right after its own core instructions.
 */
export const BotSystemPromptAppendSettingKey = "bot_system_prompt_append";

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

/**
 * The emoji a message can be reacted with. Kept small and fixed, so the
 * picker stays a row and every reaction reads the same everywhere.
 */
export const BotMessageReactions = [
    {
        title: "Like",
        value: "👍",
    },
    {
        title: "Love",
        value: "❤️",
    },
    {
        title: "Laugh",
        value: "😂",
    },
    {
        title: "Surprised",
        value: "😮",
    },
    {
        title: "Sad",
        value: "😢",
    },
    {
        title: "Celebrate",
        value: "🎉",
    },
] as const;

export type BotMessageReactionEmoji = (typeof BotMessageReactions)[number]["value"];

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

/**
 * A conversation (one bot, in its own chat or one workspace) is split into
 * sessions so no single history grows without bound. One is active per
 * conversation; closed ones can be browsed and reopened.
 */
export const BotSessionStatuses = [
    {
        title: "Active",
        value: "active",
    },
    {
        title: "Closed",
        value: "closed",
    },
] as const;

export type BotSessionStatus = (typeof BotSessionStatuses)[number]["value"];

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
