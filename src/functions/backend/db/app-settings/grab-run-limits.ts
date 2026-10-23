import { AppData } from "@/src/data/app-data";
import { BotReplyMaxToolStepsSettingKey } from "@/src/dict/bot-dict";
import { HarnessMaxToolStepsSettingKey } from "@/src/dict/harness-dict";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * Model turns a task run may take: the install's own limit
 * (`harness_max_tool_steps`, Settings > General), else
 * `AppData.HarnessMaxToolSteps`. `runTextLoop`'s default is the code's one,
 * so a task run passes this in.
 */
export async function grabHarnessMaxToolSteps() {
    return readStepLimit({
        saved: await grabAppSetting({ key: HarnessMaxToolStepsSettingKey }),
        fallback: AppData.HarnessMaxToolSteps,
        max: AppData.BotStepLimitMax,
    });
}

/**
 * Model turns a chat reply may take: the install's own limit
 * (`bot_reply_max_tool_steps`, Settings > General), else
 * `AppData.BotReplyMaxToolSteps`.
 */
export async function grabReplyMaxToolSteps() {
    return readStepLimit({
        saved: await grabAppSetting({ key: BotReplyMaxToolStepsSettingKey }),
        fallback: AppData.BotReplyMaxToolSteps,
        max: AppData.BotStepLimitMax,
    });
}

/**
 * Both limits with their defaults, for the settings page.
 */
export default async function grabRunLimitsOverview() {
    const [task_steps, reply_steps] = await Promise.all([
        grabHarnessMaxToolSteps(),
        grabReplyMaxToolSteps(),
    ]);

    const overview: RunLimitsOverview = {
        task_steps,
        reply_steps,
        task_default: AppData.HarnessMaxToolSteps,
        reply_default: AppData.BotReplyMaxToolSteps,
        max: AppData.BotStepLimitMax,
    };

    return overview;
}

export type RunLimitsOverview = {
    /**
     * The limit a task run uses right now.
     */
    task_steps: number;
    /**
     * The limit a chat reply uses right now.
     */
    reply_steps: number;
    /**
     * What a task run uses when the install saved no limit.
     */
    task_default: number;
    /**
     * What a chat reply uses when the install saved no limit.
     */
    reply_default: number;
    /**
     * The most the settings page accepts.
     */
    max: number;
};
