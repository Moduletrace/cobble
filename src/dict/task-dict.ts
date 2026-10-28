/**
 * A task's status. Tasks are the crew's to-do list, every task one bot's
 * (on its own list or in a workspace), and every move through this list is a step in the
 * work: `blocked` is what a bot (or the user) sets when only the user can
 * unblock it, and `done` is only ever set once the work was verified.
 */
export const TaskStatuses = [
    {
        title: "To do",
        value: "todo",
    },
    {
        title: "Doing",
        value: "doing",
    },
    {
        title: "Blocked",
        value: "blocked",
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

export type TaskStatus = (typeof TaskStatuses)[number]["value"];

/**
 * The statuses a task still needs work in: what a reminder may name and
 * what a digest shows.
 */
export const OpenTaskStatuses = ["todo", "doing", "blocked"] as const;

/**
 * Every status as a zod-friendly tuple of its values.
 */
export const TaskStatusValues = TaskStatuses.map((status) => status.value) as unknown as [
    TaskStatus,
    ...TaskStatus[],
];

export type OpenTaskStatus = (typeof OpenTaskStatuses)[number];

/**
 * Who created a task: the user by hand, or a bot with its tool.
 */
export const TaskOrigins = [
    {
        title: "User",
        value: "user",
    },
    {
        title: "Bot",
        value: "bot",
    },
] as const;

export type TaskOrigin = (typeof TaskOrigins)[number]["value"];

/**
 * Who wrote a note on a task. The same values as a message's authors.
 */
export const TaskAuthors = [
    {
        title: "User",
        value: "user",
    },
    {
        title: "Bot",
        value: "bot",
    },
] as const;

export type TaskAuthor = (typeof TaskAuthors)[number]["value"];

/**
 * What a file linked to a task is for: the thing the task produced
 * (`deliverable`), or something it needs to do the work (`reference`).
 */
export const TaskMediaKinds = [
    {
        title: "Deliverable",
        value: "deliverable",
    },
    {
        title: "Reference",
        value: "reference",
    },
] as const;

export type TaskMediaKind = (typeof TaskMediaKinds)[number]["value"];
