import { TaskPlanPrompt } from "@/src/data/harness-prompts";
import generateText from "@/src/harness/text/generate-text";
import pushUserTurn from "@/src/harness/text/push-user-turn";
import type { HarnessCandidate, HarnessMessage } from "@/src/harness/types";
import type { BotTaskPlan } from "./bot-task-plan-schema";
import parseBotTaskPlan from "./parse-bot-task-plan";

type Params = {
    /**
     * The system prompt the run's own turns send, unchanged: this turn
     * shares its cached prefix, so the plan costs little more than the
     * plan itself.
     */
    system: string;
    /**
     * What the run opens with (its brief, and what the user wrote since).
     * Planned from a copy: the run's own opening is left as it is.
     */
    messages: HarnessMessage[];
    signal: AbortSignal;
    bot_id?: number | string;
    workspace_id?: number | string | null;
    generate?: typeof generateText;
};

/**
 * Asks the run's model for the plan before the run takes a step
 * (`TaskPlanPrompt`). One turn, no tools: a plan that takes steps to write
 * is the wandering it exists to avoid.
 *
 * Null when the answer isn't a plan, so the run starts unplanned rather
 * than steered by one it can't read.
 */
export default async function planBotTask({
    system,
    messages,
    signal,
    bot_id,
    workspace_id,
    generate = generateText,
}: Params): Promise<{ plan: BotTaskPlan; candidate: HarnessCandidate } | null> {
    const planning = structuredClone(messages);

    pushUserTurn({ transcript: planning, content: TaskPlanPrompt });

    const answer = await generate({
        messages: [{ role: "system", content: system }, ...planning],
        signal,
        bot_id,
        workspace_id,
    });

    const plan = parseBotTaskPlan({ text: answer.text });

    return plan ? { plan, candidate: answer.candidate } : null;
}