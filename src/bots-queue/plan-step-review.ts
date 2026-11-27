import type { ReplyStatus } from "@/src/dict/reply-status-dict";
import type { HarnessToolUse } from "@/src/harness/types";
import PlanWorkStartingTools from "@/src/utils/plan-work-starting-tools";

type PlanStep = {
    id: number;
    title: string;
    current_step: number | null;
    total_steps: number;
};

type Params = {
    /**
     * The plan this run sits in: the one it was queued for, or the one
     * open in its conversation.
     */
    plan: PlanStep | null;
    /**
     * The job was queued by the plan (`enqueuePlanStep`), not by a message.
     */
    on_step: boolean;
    tool_uses: HarnessToolUse[];
    status?: ReplyStatus;
};

/**
 * The tools that end a step without its card, and are meant to: the run
 * asks the user (the card itself), changes the plan (its card takes over),
 * or hands work on whose report comes later. Anything else that ends a step
 * leaves the plan waiting on nothing, and the user has to say "move on".
 */
const EndingTools = ["ask_user", "update_plan", ...PlanWorkStartingTools];

/**
 * Checks a plan step's reply before it goes out: the step ends on a card
 * whose first option continues the plan, so the plan moves on from the card
 * in front of the user, never from the bot remembering to ask. A reply that
 * reports the step and ends is sent back. It holds for an ordinary reply
 * too, once it has ticked a step with `complete_plan_step`: a step marked
 * done with no card under its report leaves the plan with nothing to move
 * on from.
 */
export default function planStepReviewNote({ plan, on_step, tool_uses, status }: Params) {
    if (!plan || plan.current_step == null) return null;

    const ticked = tool_uses.some((use) => use.ok && use.name == "complete_plan_step");

    if (!on_step && !ticked) return null;

    /**
     * A reply that says what stopped it, or hands the work to a run of its
     * own, ends the step where the user can see it.
     */
    if (status == "working" || status == "blocked") return null;

    const ended = tool_uses.some((use) => use.ok && EndingTools.includes(use.name));

    if (ended) return null;

    const step = plan.current_step + 1;
    const next = step + 1;
    const last_step = next > plan.total_steps;

    return on_step
        ? `This reply works step ${step} of Plan #${plan.id} ("${plan.title}") and ended without the step's card, so the plan has nothing to move on from. Do that step, not another: finish it with complete_plan_step and what it produced, then report it in two or three sentences, and put the card up in the same turn with ask_user. The card asks "Continue with the plan?": first option "${last_step ? "Finish the plan" : `Continue to step ${next}`}", second option "Pause the plan", then any choice the step really needs. If it needs the user for something else, ask that on the card too. If the plan itself is wrong, change it with update_plan. If the work has to be handed on, start it. Don't write a plan of your own in a file, and don't answer with a different piece of the work.`
        : `This reply finished step ${step} of Plan #${plan.id} ("${plan.title}") with complete_plan_step but ended without the step's card, so the plan has nothing to move on from. Keep the report and put the card up in the same turn with ask_user: it asks "Continue with the plan?", first option "${last_step ? "Finish the plan" : `Continue to step ${next}`}", second option "Pause the plan". Don't take the tick back and don't work another step here.`;
}
