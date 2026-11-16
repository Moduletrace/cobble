import { BotPlanStepStates, type BotPlanStepState } from "@/src/dict/bot-plan-dict";

export type BotPlanStepRecord = {
    text: string;
    state: BotPlanStepState;
    /**
     * What the step produced, written when it was completed.
     */
    note: string;
};

/**
 * The steps of a plan as they come out of `bot_plans.steps` (a JSON
 * column). Anything unreadable is dropped rather than thrown: a plan with a
 * damaged step still shows the rest of itself, which is better than a card
 * that won't open.
 */
export default function parseBotPlanSteps({ text }: { text: string | null | undefined }): BotPlanStepRecord[] {
    if (!text) return [];

    let parsed: unknown;

    try {
        parsed = JSON.parse(text);
    } catch {
        return [];
    }

    if (!Array.isArray(parsed)) return [];

    const states = BotPlanStepStates.map((state) => state.value) as string[];

    return parsed.flatMap((item) => {
        if (!item || typeof item != "object") return [];

        const row = item as Record<string, unknown>;
        const step_text = typeof row.text == "string" ? row.text.trim() : "";

        if (!step_text) return [];

        const state = typeof row.state == "string" && states.includes(row.state) ? (row.state as BotPlanStepState) : "pending";

        return [
            {
                text: step_text,
                state,
                note: typeof row.note == "string" ? row.note : "",
            },
        ];
    });
}