import BunSQLite from "@moduletrace/bun-sqlite";
import grabSkill from "./grab-skill";

type Params = {
    skill_id: number | string;
};

/**
 * Deletes a skill, and its bot and workspace links with it. The links are
 * deleted here rather than left to the schema's cascade: foreign keys are
 * off outside the server process (`enableForeignKeys`), so a delete from a
 * script would otherwise strand them.
 */
export default async function deleteSkill({ skill_id }: Params) {
    const skill = await grabSkill({ skill_id });

    await BunSQLite.sql({ sql: `DELETE FROM bot_skills WHERE skill_id = ?`, values: [skill.id] });
    await BunSQLite.sql({ sql: `DELETE FROM workspace_skills WHERE skill_id = ?`, values: [skill.id] });

    const res = await BunSQLite.sql({ sql: `DELETE FROM skills WHERE id = ?`, values: [skill.id] });

    if (!res.success) throw new Error(`Couldn't delete the skill: ${res.error}`);

    return skill;
}
