import { AskDecisionSchema, type AskDecisionPlan } from "./ask-decision-schema";

type Params = {
    text: string;
};

/**
 * Reads the gate's answer: the first `{` to the last `}` as JSON, validated.
 * Null when it isn't a usable decision (a fence, an explanation or a missing
 * field), so the caller can ask once more.
 */
export default function parseAskDecision({ text }: Params): AskDecisionPlan | null {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start == -1 || end <= start) return null;

    try {
        const parsed = AskDecisionSchema.safeParse(JSON.parse(text.slice(start, end + 1)));

        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}
