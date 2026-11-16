import type { BotPlanStepRecord } from "@/src/utils/parse-bot-plan-steps";

type Params = {
    /**
     * The steps already worked (done or skipped), in the order they were.
     */
    finished: BotPlanStepRecord[];
    /**
     * The steps as the user now wants them.
     */
    next: BotPlanStepRecord[];
};

/**
 * What the user's rewrite of a plan's steps breaks, or null when it's
 * allowed. Finished steps are the record of work that really happened: they
 * keep their place at the top and their note, so the only thing a rewrite
 * may not touch is them. Everything after is theirs.
 */
export default function planStepsRewriteProblem({ finished, next }: Params) {
    const kept = next.slice(0, finished.length);
    const same = kept.every(
        (step, index) => step.text.toLowerCase() == (finished[index]?.text || "").toLowerCase(),
    );

    if (kept.length == finished.length && same) return null;

    return `${
        finished.length == 1 ? "A step that's already done can't" : "The steps already done can't"
    } be changed, removed or moved: they're what was worked. Leave them at the top and change the ones after them.`;
}