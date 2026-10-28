import { AppData } from "@/src/data/app-data";
import { LogsKeepDaysSettingKey } from "@/src/dict/log-categories";
import type { LogRetentionOverview } from "@/src/types";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * How many days logs are kept: the install's own number (`logs_keep_days`,
 * Settings > General), else `AppData.LogsKeepDays`.
 */
export async function grabLogsKeepDays() {
    return readStepLimit({
        saved: await grabAppSetting({ key: LogsKeepDaysSettingKey }),
        fallback: AppData.LogsKeepDays,
        max: AppData.LogsKeepDaysMax,
    });
}

/**
 * The number with its default and ceiling, for the settings page.
 */
export default async function grabLogRetentionOverview() {
    const overview: LogRetentionOverview = {
        keep_days: await grabLogsKeepDays(),
        default_days: AppData.LogsKeepDays,
        max: AppData.LogsKeepDaysMax,
    };

    return overview;
}
