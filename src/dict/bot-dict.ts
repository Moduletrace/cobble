/**
 * The palette a bot starts from: a suggested colour and the stone shape that
 * goes with it. A bot's colour is free (any `#rrggbb`), so these are only
 * the tiles the picker offers and the colours a new bot is given. Shape is
 * stored separately (`bots.stone`), so a custom colour keeps its stone.
 */
export const BotHues = [
    {
        title: "Ember",
        value: "ember",
        color: "#e4572e",
    },
    {
        title: "Amber",
        value: "amber",
        color: "#e9a23b",
    },
    {
        title: "Moss",
        value: "moss",
        color: "#7fae3c",
    },
    {
        title: "Teal",
        value: "teal",
        color: "#16a394",
    },
    {
        title: "Cobalt",
        value: "cobalt",
        color: "#3b7dd8",
    },
    {
        title: "Violet",
        value: "violet",
        color: "#7c5cd6",
    },
    {
        title: "Rose",
        value: "rose",
        color: "#d6538c",
    },
] as const;

/**
 * Historical palette name. Kept for `bots.hue`, which is only read as a
 * fallback for a bot saved before `color` and `stone` existed.
 */
export type BotHue = (typeof BotHues)[number]["value"];

/**
 * The stone shapes. One flat cut each, from the handoff icon set. Shape is
 * the bot's own, independent of its colour.
 */
export const BotStoneShapes = [
    {
        title: "Ember stone",
        value: "ember",
    },
    {
        title: "Amber stone",
        value: "amber",
    },
    {
        title: "Moss stone",
        value: "moss",
    },
    {
        title: "Teal stone",
        value: "teal",
    },
    {
        title: "Cobalt stone",
        value: "cobalt",
    },
    {
        title: "Violet stone",
        value: "violet",
    },
    {
        title: "Rose stone",
        value: "rose",
    },
] as const;

export type BotStoneShape = (typeof BotStoneShapes)[number]["value"];

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
