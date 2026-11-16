import type { BotPlanStepRecord } from "@/src/utils/parse-bot-plan-steps";

/**
 * How much of a plan is behind it: steps done or skipped, of all of them.
 * The card reads "2 of 5 done" from this, and the prompt says how far in
 * the run is.
 */
export default function planStepCounts({ steps }: { steps: BotPlanStepRecord[] }) {
    const finished = steps.filter((step) => step.state != "pending").length;

    return { finished, total: steps.length };
}