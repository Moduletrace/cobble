import { AppData } from "@/src/data/app-data";
import { HookEventsKeepDaysSettingKey } from "@/src/dict/bot-hook-dict";
import type { HookCallRetentionOverview } from "@/src/types";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * How many days hook calls (and their responses) are kept: the install's
 * own number (`hook_events_keep_days`, Settings > General), else
 * `AppData.BotHookEventsKeepDays`.
 */
export async function grabHookEventsKeepDays() {
    return readStepLimit({
        saved: await grabAppSetting({ key: HookEventsKeepDaysSettingKey }),
        fallback: AppData.BotHookEventsKeepDays,
        max: AppData.BotHookEventsKeepDaysMax,
    });
}

/**
 * The number with its default and ceiling, for the settings page.
 */
export default async function grabHookCallRetentionOverview() {
    const overview: HookCallRetentionOverview = {
        keep_days: await grabHookEventsKeepDays(),
        default_days: AppData.BotHookEventsKeepDays,
        max: AppData.BotHookEventsKeepDaysMax,
    };

    return overview;
}
