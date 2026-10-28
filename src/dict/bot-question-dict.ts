/**
 * Where questions a bot asked a user stand (`bot_questions.status`):
 * `pending` until the user answers them (`answered`) or skips them.
 */
export const BotQuestionStatuses = ["pending", "answered", "skipped"] as const;

export type BotQuestionStatus = (typeof BotQuestionStatuses)[number];

/**
 * How a question is answered: `single` picks one option (radios),
 * `multiple` any number of them, at least one (checkboxes).
 */
export const BotQuestionKinds = ["single", "multiple"] as const;

export type BotQuestionKind = (typeof BotQuestionKinds)[number];
