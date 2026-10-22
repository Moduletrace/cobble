import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_SKILLS } from "@/db/types/db";
import type { SkillsOverviewPayload } from "@/src/types";
import grabCrewRole from "../access/grab-crew-role";
import grabExtensionAccess from "./grab-extension-access";
import grabExtensionTargets from "./grab-extension-targets";
import parseSkillRow from "./parse-skill-row";

type Params = {
    user_id: number | string;
};

/**
 * The Skills settings page: every skill with who gets it, and what it can
 * be attached to. A skill holds nothing secret, so admins read it too;
 * only a super admin adds, edits or deletes.
 */
export default async function grabSkillsOverview({ user_id }: Params): Promise<SkillsOverviewPayload> {
    const role = await grabCrewRole({ user_id });
    const [rows, access, targets] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_SKILLS>({ sql: `SELECT * FROM skills ORDER BY name COLLATE NOCASE ASC, id ASC` }),
        grabExtensionAccess({ kind: "skill" }),
        grabExtensionTargets({ role }),
    ]);

    return {
        ...targets,
        skills: (rows.payload || []).map((row) => {
            const { all_bots, ...skill } = parseSkillRow({ row });

            return { ...skill, access: { all_bots, ...access(skill.id) } };
        }),
    };
}
