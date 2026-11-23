import type { BotPlanView } from "@/src/types";

type Params = {
    plan?: BotPlanView | null;
};

/**
 * Whether this plan change means a reply is on its way in its conversation.
 * Approving an active plan or picking it back up queues its step with no
 * user message before it, so the thread must show the thinking row at once
 * instead of waiting for the run's first step push.
 */
export default function planMarksReplyDue({ plan }: Params) {
    return plan?.status == "active";
}