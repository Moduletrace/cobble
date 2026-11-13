import { AppData } from "@/src/data/app-data";
import { BotTraceKeepDaysSettingKey } from "@/src/dict/bot-trace-dict";
import type { BotTraceRetentionOverview } from "@/src/types";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * How many days a run's detailed trace is kept (the debug view): the
 * install's own number (`bot_trace_keep_days`, Settings > General), else
 * `AppData.BotTraceKeepDays`.
 */
export async function grabBotTraceKeepDays() {
    return readStepLimit({
        saved: await grabAppSetting({ key: BotTraceKeepDaysSettingKey }),
        fallback: AppData.BotTraceKeepDays,
        max: AppData.BotTraceKeepDaysMax,
    });
}

/**
 * The number with its default and ceiling, for the settings page.
 */
export default async function grabBotTraceRetentionOverview() {
    const overview: BotTraceRetentionOverview = {
        keep_days: await grabBotTraceKeepDays(),
        default_days: AppData.BotTraceKeepDays,
        max: AppData.BotTraceKeepDaysMax,
    };

    return overview;
}