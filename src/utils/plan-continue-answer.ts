import type { BotQuestionView } from "@/src/types";

/**
 * Whether the answer to a plan's card said to carry on. The plan's step
 * ends with a card whose first option is Continue (`PlanStepNote`), so
 * only that picked option moves the plan: Pause, an answer typed into
 * "Other", a skip or a plain answer all leave it where it is.
 */
export default function planContinueAnswer({ view }: { view: BotQuestionView }) {
    if (view.status != "answered") return false;

    return Boolean(view.answers?.[0]?.choices?.includes(0));
}