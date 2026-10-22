import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_SKILLS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseSkillRow from "./parse-skill-row";

type Params = {
    skill_id: number | string;
};

/**
 * One skill, or an `AppError` when there's none.
 */
export default async function grabSkill({ skill_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_SKILLS>({
            sql: `SELECT * FROM skills WHERE id = ?`,
            values: [skill_id],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That skill doesn't exist.`);

    return parseSkillRow({ row });
}
