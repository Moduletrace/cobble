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
