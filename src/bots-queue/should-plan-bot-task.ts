import { AppData } from "@/src/data/app-data";
import { isUnlimitedLimit, type RunLimit } from "@/src/utils/run-limit";

/**
 * Whether a task run plans before its first step (`planBotTask`).
 *
 * Planning is an economy, not a rule. It costs one turn, mostly served
 * from the cache the run's own turns share, and it saves the steps a run
 * spends working out what it is doing. A run too short to repay that gets
 * nothing from it: its first turn is its plan. An unlimited run always
 * plans, since it has the steps to repay it.
 */
export default function shouldPlanBotTask({ max_steps }: { max_steps: RunLimit }) {
    if (isUnlimitedLimit(max_steps)) return true;

    return max_steps >= AppData.BotTaskPlanMinSteps;
}