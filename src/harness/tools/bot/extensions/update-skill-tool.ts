import { z } from "zod";
import grabSkill from "@/src/functions/backend/db/extensions/grab-skill";
import saveSkill from "@/src/functions/backend/db/extensions/save-skill";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";

type Params = {
    user_id: number | string;
};

type Args = {
    skill_id: number;
    enabled?: boolean;
    all_bots?: boolean;
};

/**
 * Lets the coordinator turn a skill on or off, or give it to every bot.
 * Its words (name, slug, description, runbook) change only through
 * `propose_skill`, which the user confirms.
 */
export default function updateSkillTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "update_skill",
        description: `Turn a skill on or off (enabled), or give it to every bot now and every new one (all_bots). To give it to some bots use set_extension_access. To add a skill or change its name, slug, description or runbook, use propose_skill: the user confirms those.`,
        schema: z
            .object({
                skill_id: z.number().int().positive(),
                enabled: z.boolean().optional(),
                all_bots: z.boolean().optional(),
            })
            .refine((args) => args.enabled !== undefined || args.all_bots !== undefined, "Give enabled or all_bots."),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const current = await grabSkill({ skill_id: args.skill_id });

            await saveSkill({
                user_id,
                data: {
                    skill_id: current.id,
                    name: current.name,
                    slug: current.slug,
                    description: current.description,
                    body: current.body,
                    enabled: args.enabled ?? current.enabled,
                    all_bots: args.all_bots ?? current.all_bots,
                },
            });

            const saved = await grabSkill({ skill_id: current.id });

            await logEvent({
                title: "Skill changed",
                category: "system",
                user_id: Number(user_id),
                plain_text: `The coordinator changed the skill ${saved.name} (#${saved.id}, ${saved.slug}).`,
                metadata: { skill_id: saved.id, enabled: saved.enabled, all_bots: saved.all_bots },
            });

            return `Skill #${saved.id} "${saved.name}" is ${saved.enabled ? "on" : "off"}.${saved.all_bots ? " Every bot gets it." : ""}`;
        },
    };
}
