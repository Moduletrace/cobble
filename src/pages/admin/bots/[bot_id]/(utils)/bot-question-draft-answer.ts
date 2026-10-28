import type { BotQuestionAnswer } from "@/src/types";

/**
 * One question's answer while the user fills in the card: the options
 * picked, whether "Other" is picked, and what's typed into it.
 */
export type BotQuestionDraft = {
    choices: number[];
    other_on: boolean;
    other: string;
};

type Params = {
    draft: BotQuestionDraft;
};

/**
 * A question's draft as the answer sent: "Other" counts only while picked.
 */
export default function botQuestionDraftAnswer({ draft }: Params): BotQuestionAnswer {
    return { choices: draft.choices, other: draft.other_on ? draft.other.trim() : "" };
}
