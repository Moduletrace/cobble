/**
 * What a skill is: a runbook a bot follows. It reads the name and
 * description in its prompt and pulls the body with `load_skill` only when
 * the skill applies, so a long runbook costs nothing until it's needed.
 */
export const SkillNoun = "skill";

/**
 * The tool a bot calls to read a skill's body.
 */
export const LoadSkillToolName = "load_skill";

/**
 * The slug format, for the settings form and its hint.
 */
export const SkillSlugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * The `app_settings` keys for the longest runbook a skill may save, and
 * how much of it `load_skill` hands back at once (Settings > General).
 * Unset, `AppData.SkillBodyMaxChars` and `AppData.SkillBodyShownChars`.
 */
export const SkillBodyMaxCharsSettingKey = "skill_body_max_chars";
export const SkillBodyShownCharsSettingKey = "skill_body_shown_chars";
