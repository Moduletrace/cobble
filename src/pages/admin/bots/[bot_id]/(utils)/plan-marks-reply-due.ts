import type { BotPlanView } from "@/src/types";

type Params = {
    plan?: BotPlanView | null;
};

/**
 * Whether this plan change means a reply is on its way in its conversation.
 * An active plan is one the app advances by itself: approving it, picking it
 * back up or finishing a step queues the next step with no user message
 * before it, so the thread must show the thinking row at once instead of
 * waiting for the run's first step push.
 */
export default function planMarksReplyDue({ plan }: Params) {
    return plan?.status == "active";
}