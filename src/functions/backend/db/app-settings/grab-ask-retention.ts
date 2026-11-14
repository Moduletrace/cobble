import { AppData } from "@/src/data/app-data";
import { AskKeepDaysSettingKey, AskMaxPerPlaceSettingKey } from "@/src/dict/ask-dict";
import type { AskRetentionOverview } from "@/src/types";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * How many days ended crew requests are kept: the install's own number
 * (`ask_keep_days`, Settings > General), else `AppData.AskKeepDays`.
 */
export async function grabAskKeepDays() {
    return readStepLimit({
        saved: await grabAppSetting({ key: AskKeepDaysSettingKey }),
        fallback: AppData.AskKeepDays,
        max: AppData.AskKeepDaysMax,
    });
}

/**
 * How many ended requests one place keeps, newest first: the install's own
 * number (`ask_max_per_place`), else `AppData.AskMaxPerPlace`.
 */
export async function grabAskMaxPerPlace() {
    return readStepLimit({
        saved: await grabAppSetting({ key: AskMaxPerPlaceSettingKey }),
        fallback: AppData.AskMaxPerPlace,
        max: AppData.AskMaxPerPlaceMax,
    });
}

/**
 * The numbers with their defaults and ceilings, for the settings page.
 */
export default async function grabAskRetention(): Promise<AskRetentionOverview> {
    return {
        keep_days: await grabAskKeepDays(),
        keep_days_default: AppData.AskKeepDays,
        keep_days_max: AppData.AskKeepDaysMax,
        max_per_place: await grabAskMaxPerPlace(),
        max_per_place_default: AppData.AskMaxPerPlace,
        max_per_place_max: AppData.AskMaxPerPlaceMax,
    };
}
