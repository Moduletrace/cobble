import type { ReplyStatus } from "@/src/dict/reply-status-dict";
import type { HarnessToolUse } from "@/src/harness/types";
import { WorkStartingTools } from "@/src/utils/should-continue-plan";

type PlanStep = {
    id: number;
    title: string;
    current_step: number | null;
};

type Params = {
    /**
     * The plan the run works, when it was queued for one of its steps.
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
 * The tools that end a step without finishing it, and are meant to: the run
 * asks the user, changes the plan, or hands work on whose report comes
 * later. A run that did none of these and never called
 * `complete_plan_step` did something else entirely (a step of its own, a
 * plan written to a file), and the app would otherwise carry the plan on
 * past the step it never did.
 */
const EndingTools = ["ask_user", "update_plan", ...WorkStartingTools];

/**
 * Checks a plan step's reply before it goes out: the run works one step,
 * and must either finish it or say why it can't. Returns a note that sends
 * the answer back to the model, or null when the reply ends the step the
 * way the plan expects.
 */
export default function planStepReviewNote({ plan, on_step, tool_uses, status }: Params) {
    if (!on_step || !plan || plan.current_step == null) return null;

    /**
     * A reply that started work or says what stopped it already ends the
     * step honestly; the plan waits on the user or the run it started.
     */
    if (status == "working" || status == "blocked") return null;

    const ended = tool_uses.some((use) => use.ok && (use.name == "complete_plan_step" || EndingTools.includes(use.name)));

    if (ended) return null;

    const step = plan.current_step + 1;

    return `This reply works step ${step} of Plan #${plan.id} ("${plan.title}") and did not finish it. Do that step, not another: finish it with complete_plan_step and what it produced, then report it in two or three sentences. If it needs the user, ask with ask_user. If the plan itself is wrong, change it with update_plan. If the work has to be handed on, start it. Don't write a plan of your own in a file, and don't answer with a different piece of the work.`;
}