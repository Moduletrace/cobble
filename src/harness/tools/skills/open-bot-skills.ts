import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { SkillsNote } from "@/src/data/harness-prompts";
import { LoadSkillToolName } from "@/src/dict/skill-dict";
import type { SkillRecord } from "@/src/types";
import type { HarnessTool } from "../../types";

type Params = {
    /**
     * The skills the run reaches (`grabBotExtensions`).
     */
    skills: SkillRecord[];
    /**
     * Names the run's built-in tools already use: they win.
     */
    taken?: string[];
};

export type OpenBotSkills = {
    tools: HarnessTool[];
    /**
     * For the system prompt: one line per skill, and that the body is read
     * with `load_skill`. Empty when the run has none.
     */
    note: string;
};

/**
 * The skills a run has, as one `load_skill` tool plus the lines that say
 * which ones exist. A skill's body costs nothing until the bot asks for it,
 * so a run that never needs a long runbook never pays for it.
 */
export default function openBotSkills({ skills, taken = [] }: Params): OpenBotSkills {
    const enabled = skills.filter((skill) => skill.enabled);

    if (!enabled.length || taken.includes(LoadSkillToolName)) return { tools: [], note: "" };

    const by_slug = new Map(enabled.map((skill) => [skill.slug, skill]));
    const slugs = enabled.map((skill) => skill.slug);

    const list = enabled.map((skill) => `- ${skill.slug}: ${skill.description}`).join("\n");

    const tool: HarnessTool<{ slug: string }> = {
        name: LoadSkillToolName,
        description: `Reads one of your skills in full. Pass its slug. The skills you have, and when each applies:\n${list}`,
        schema: z.object({ slug: z.string().trim().min(1, "Pass the skill's slug") }),
        run: async ({ args }) => {
            const skill = by_slug.get(args.slug);

            if (!skill) {
                throw new Error(
                    `You have no skill called "${args.slug}". Load one of: ${slugs.join(", ")}.`,
                );
            }

            const body = skill.body || "";

            if (!body) return `The skill ${skill.name} (${skill.slug}) is empty.`;

            if (body.length <= AppData.SkillBodyShownChars) return body;

            return `${body.slice(0, AppData.SkillBodyShownChars)}\n\n[Cut at ${AppData.SkillBodyShownChars} characters. The skill continues: ask the user to split it if you need the rest.]`;
        },
    };

    return { tools: [tool], note: SkillsNote };
}
