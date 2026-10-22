import BunSQLite from "@moduletrace/bun-sqlite";
import attachToAllBots from "./attach-to-all-bots";
import type { BUN_SQLITE_COBBLE_SKILLS, BunSQLiteTables } from "@/db/types/db";
import type { SaveSkillRequest } from "@/src/schemas/extension-schema";
import AppError from "@/src/utils/app-error";
import grabSkill from "./grab-skill";

type Params = {
    /**
     * The super admin saving it (checked by the caller).
     */
    user_id: number | string;
    data: SaveSkillRequest;
};

/**
 * Adds or edits a skill and returns its id. Slugs are unique: a bot loads a
 * skill by its slug, so two skills can't answer to the same one.
 */
export default async function saveSkill({ user_id, data }: Params) {
    const clash = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM skills WHERE slug = ? AND id != ?`,
            values: [data.slug, data.skill_id || 0],
        })
    ).payload?.[0];

    if (clash) throw new AppError(`Another skill already uses the slug ${data.slug}.`);

    const fields = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        body: data.body,
        enabled: data.enabled ? 1 : 0,
        all_bots: data.all_bots ? 1 : 0,
    } as const;

    if (data.skill_id) {
        const skill = await grabSkill({ skill_id: data.skill_id });
        const res = await BunSQLite.update<BUN_SQLITE_COBBLE_SKILLS, (typeof BunSQLiteTables)[number]>({
            table: "skills",
            targetId: skill.id,
            data: fields,
        });

        if (!res.success) throw new Error(`Couldn't save the skill: ${res.msg}`);

        if (data.all_bots && !skill.all_bots) await attachToAllBots({ kind: "skill", id: skill.id });

        return skill.id;
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_SKILLS, (typeof BunSQLiteTables)[number]>({
        table: "skills",
        data: [{ ...fields, user_id: Number(user_id) }],
    });

    const id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !id) throw new Error(`Couldn't add the skill: ${res.msg}`);

    if (data.all_bots) await attachToAllBots({ kind: "skill", id: Number(id) });

    return Number(id);
}
