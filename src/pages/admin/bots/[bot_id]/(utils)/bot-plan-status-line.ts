import type { BotPlanView } from "@/src/types";

type Params = {
    view: Pick<BotPlanView, "status" | "current_step" | "total_steps" | "finished_steps" | "bot_name">;
};

/**
 * The line a plan's card carries under its title: where the plan stands,
 * and what the user can do about it.
 */
export default function botPlanStatusLine({ view }: Params) {
    const step = view.current_step == null ? view.total_steps : view.current_step + 1;

    switch (view.status) {
        case "planned":
            return `${view.bot_name} wrote this plan. Approve it to start, or change the steps first.`;
        case "active":
            return `Step ${step} of ${view.total_steps}: ${view.bot_name} works one step per reply and reports each.`;
        case "paused":
            return `Paused at step ${step} of ${view.total_steps}. Pick it back up when you're ready.`;
        case "done":
            return `Every step is done (${view.finished_steps} of ${view.total_steps}).`;
        case "cancelled":
            return `Cancelled at step ${step} of ${view.total_steps}.`;
        default:
            return `Step ${step} of ${view.total_steps}.`;
    }
}