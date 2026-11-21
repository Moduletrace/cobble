import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_SKILLS } from "@/db/types/db";
import type { SaveSkillRequest } from "@/src/schemas/extension-schema";
import parseSkillRow from "../extensions/parse-skill-row";
import type { ExtensionBundleEntry } from "./extension-bundle-entry";

type Params = {
    /**
     * The rows picked, or none for every one.
     */
    ids: number[];
};

/**
 * Skills as a bundle carries them: the whole runbook and the line saying
 * when to load it.
 */
export default async function exportSkills({ ids }: Params): Promise<ExtensionBundleEntry[]> {
    const rows = await BunSQLite.sql<BUN_SQLITE_COBBLE_SKILLS>({
        sql: `SELECT * FROM skills ORDER BY name COLLATE NOCASE ASC, id ASC`,
    });

    const wanted = ids.length ? new Set(ids.map(Number)) : null;

    return (rows.payload || [])
        .map((row) => parseSkillRow({ row }))
        .filter((skill) => !wanted || wanted.has(skill.id))
        .map((skill) => {
            const config: SaveSkillRequest = {
                name: skill.name,
                slug: skill.slug,
                description: skill.description,
                body: skill.body,
                enabled: skill.enabled,
                all_bots: false,
            };

            return {
                id: skill.id,
                item: {
                    kind: "skill",
                    key: skill.slug || skill.name,
                    config,
                    redacted: [],
                    env_keys: [],
                    notes: [],
                    documents: [],
                },
            };
        });
}