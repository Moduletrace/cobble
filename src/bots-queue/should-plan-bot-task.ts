import { AppData } from "@/src/data/app-data";

/**
 * Whether a task run plans before its first step (`planBotTask`).
 *
 * Planning is an economy, not a rule. It costs one turn, mostly served
 * from the cache the run's own turns share, and it saves the steps a run
 * spends working out what it is doing. A run too short to repay that gets
 * nothing from it: its first turn is its plan.
 *
 * A chatroom turn is never planned: it is short, it has almost no tools,
 * and nobody follows it.
 */
export default function shouldPlanBotTask({
    max_steps,
    in_chatroom,
}: {
    max_steps: number;
    in_chatroom?: boolean;
}) {
    if (in_chatroom) return false;

    return max_steps >= AppData.BotTaskPlanMinSteps;
}