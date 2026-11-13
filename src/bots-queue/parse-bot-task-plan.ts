import { BotTaskPlanSchema, type BotTaskPlan } from "./bot-task-plan-schema";

/**
 * Reads the plan a planning turn answered with. Models wrap JSON in a code
 * fence or a sentence whatever the prompt says, so the object is cut out
 * of the answer first. Null when it isn't a plan: the run then starts the
 * way it always did, since a plan is an economy and never a gate.
 */
export default function parseBotTaskPlan({ text }: { text?: string | null }): BotTaskPlan | null {
    if (!text) return null;

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start < 0 || end <= start) return null;

    let value: unknown;

    try {
        value = JSON.parse(text.slice(start, end + 1));
    } catch {
        return null;
    }

    const parsed = BotTaskPlanSchema.safeParse(value);

    return parsed.success ? parsed.data : null;
}