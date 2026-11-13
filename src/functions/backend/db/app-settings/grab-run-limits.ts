import { AppData } from "@/src/data/app-data";
import { BotReplyMaxToolStepsSettingKey } from "@/src/dict/bot-dict";
import {
    HarnessContextBudgetSettingKey,
    HarnessMaxToolStepsSettingKey,
    HarnessModelRestSettingKey,
    RunMaxPromptTokensSettingKey,
    UnattendedMaxToolStepsSettingKey,
} from "@/src/dict/harness-dict";
import type { RunLimitsOverview } from "@/src/types";
import readRunLimit from "@/src/utils/read-run-limit";
import grabAppSetting from "./grab-app-setting";

export type { RunLimitsOverview };

/**
 * Model turns a task run may take: the install's own limit
 * (`harness_max_tool_steps`, Settings > General), else
 * `AppData.HarnessMaxToolSteps` (unlimited). `runTextLoop`'s default is the
 * code's one, so a task run passes this in.
 */
export async function grabHarnessMaxToolSteps() {
    return readRunLimit({
        saved: await grabAppSetting({ key: HarnessMaxToolStepsSettingKey }),
        fallback: AppData.HarnessMaxToolSteps,
        max: AppData.BotStepLimitMax,
    });
}

/**
 * Model turns a chat reply may take: the install's own limit
 * (`bot_reply_max_tool_steps`, Settings > General), else
 * `AppData.BotReplyMaxToolSteps` (unlimited).
 */
export async function grabReplyMaxToolSteps() {
    return readRunLimit({
        saved: await grabAppSetting({ key: BotReplyMaxToolStepsSettingKey }),
        fallback: AppData.BotReplyMaxToolSteps,
        max: AppData.BotStepLimitMax,
    });
}

/**
 * Model turns a routine run or a hook call may take, which nobody
 * watches: the install's own limit (`unattended_max_tool_steps`), else
 * `AppData.UnattendedMaxToolSteps` (unlimited).
 */
export async function grabUnattendedMaxToolSteps() {
    return readRunLimit({
        saved: await grabAppSetting({ key: UnattendedMaxToolStepsSettingKey }),
        fallback: AppData.UnattendedMaxToolSteps,
        max: AppData.BotStepLimitMax,
    });
}

/**
 * Prompt tokens one run may spend before it must wrap up: the install's
 * own budget (`run_max_prompt_tokens`), else `AppData.RunMaxPromptTokens`.
 * Unlimited when the install chose none.
 */
export async function grabRunMaxPromptTokens() {
    return readRunLimit({
        saved: await grabAppSetting({ key: RunMaxPromptTokensSettingKey }),
        fallback: AppData.RunMaxPromptTokens,
        min: AppData.RunMaxPromptTokensMin,
        max: AppData.RunMaxPromptTokensMax,
    });
}

/**
 * The working context a run keeps per turn, in estimated tokens: the
 * install's own (`harness_context_budget_tokens`), else
 * `AppData.HarnessContextBudgetTokens`. Unlimited keeps the model's whole
 * window.
 */
export async function grabContextBudgetTokens() {
    return readRunLimit({
        saved: await grabAppSetting({ key: HarnessContextBudgetSettingKey }),
        fallback: AppData.HarnessContextBudgetTokens,
        min: AppData.HarnessContextBudgetMinTokens,
        max: AppData.HarnessContextBudgetMaxTokens,
    });
}

/**
 * How long a model that failed is passed over, in seconds: the install's
 * own (`harness_model_rest_seconds`), else `AppData.HarnessModelRestMs`.
 * Unlimited rests it until the setting changes (or the app restarts).
 */
export async function grabModelRestSeconds() {
    return readRunLimit({
        saved: await grabAppSetting({ key: HarnessModelRestSettingKey }),
        fallback: AppData.HarnessModelRestMs / 1000,
        min: AppData.HarnessModelRestMinSeconds,
        max: AppData.HarnessModelRestMaxSeconds,
    });
}

/**
 * Every run limit with its default, for the settings page. A limit is a
 * number or `"unlimited"`.
 */
export default async function grabRunLimitsOverview() {
    const [task_steps, reply_steps, unattended_steps, run_tokens, context_tokens, model_rest_seconds] =
        await Promise.all([
            grabHarnessMaxToolSteps(),
            grabReplyMaxToolSteps(),
            grabUnattendedMaxToolSteps(),
            grabRunMaxPromptTokens(),
            grabContextBudgetTokens(),
            grabModelRestSeconds(),
        ]);

    const overview: RunLimitsOverview = {
        task_steps,
        reply_steps,
        unattended_steps,
        run_tokens,
        context_tokens,
        model_rest_seconds,
        task_default: AppData.HarnessMaxToolSteps,
        reply_default: AppData.BotReplyMaxToolSteps,
        unattended_default: AppData.UnattendedMaxToolSteps,
        run_tokens_default: AppData.RunMaxPromptTokens,
        context_tokens_default: AppData.HarnessContextBudgetTokens,
        max: AppData.BotStepLimitMax,
        run_tokens_min: AppData.RunMaxPromptTokensMin,
        run_tokens_max: AppData.RunMaxPromptTokensMax,
        context_tokens_min: AppData.HarnessContextBudgetMinTokens,
        context_tokens_max: AppData.HarnessContextBudgetMaxTokens,
        model_rest_default: AppData.HarnessModelRestMs / 1000,
        model_rest_min: AppData.HarnessModelRestMinSeconds,
        model_rest_max: AppData.HarnessModelRestMaxSeconds,
    };

    return overview;
}
