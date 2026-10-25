import { AppData } from "@/src/data/app-data";
import { SkillBodyMaxCharsSettingKey, SkillBodyShownCharsSettingKey } from "@/src/dict/skill-dict";
import readStepLimit from "@/src/utils/read-step-limit";
import type { SkillLimitsOverview } from "@/src/types";
import grabAppSetting from "./grab-app-setting";

/**
 * The longest runbook a skill may save: the install's own limit
 * (`skill_body_max_chars`, Settings > General), else
 * `AppData.SkillBodyMaxChars`.
 */
export async function grabSkillBodyMaxChars() {
    return readStepLimit({
        saved: await grabAppSetting({ key: SkillBodyMaxCharsSettingKey }),
        fallback: AppData.SkillBodyMaxChars,
        max: AppData.SkillBodyLimitMax,
    });
}

/**
 * How much of a runbook `load_skill` hands back in one call: the install's
 * own limit (`skill_body_shown_chars`, Settings > General), else
 * `AppData.SkillBodyShownChars`.
 */
export async function grabSkillBodyShownChars() {
    return readStepLimit({
        saved: await grabAppSetting({ key: SkillBodyShownCharsSettingKey }),
        fallback: AppData.SkillBodyShownChars,
        max: AppData.SkillBodyLimitMax,
    });
}

/**
 * Both limits with their defaults, for the settings pages.
 */
export default async function grabSkillLimitsOverview() {
    const [body_max_chars, body_shown_chars] = await Promise.all([
        grabSkillBodyMaxChars(),
        grabSkillBodyShownChars(),
    ]);

    const overview: SkillLimitsOverview = {
        body_max_chars,
        body_shown_chars,
        body_max_default: AppData.SkillBodyMaxChars,
        body_shown_default: AppData.SkillBodyShownChars,
        max: AppData.SkillBodyLimitMax,
    };

    return overview;
}

export type { SkillLimitsOverview };
