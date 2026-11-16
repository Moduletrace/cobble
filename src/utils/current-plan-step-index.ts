import type { BotPlanStepRecord } from "@/src/utils/parse-bot-plan-steps";

/**
 * The step a plan is on: the first one still waiting. Null once none is
 * left, which is a plan with nothing more to run. Steps are worked in the
 * order the bot wrote them, so this is where the work is, never a step the
 * bot picks for itself.
 */
export default function currentPlanStepIndex({ steps }: { steps: BotPlanStepRecord[] }) {
    const index = steps.findIndex((step) => step.state == "pending");

    return index == -1 ? null : index;
}