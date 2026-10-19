import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CUSTOM_TOOLS } from "@/db/types/db";
import type { CustomToolsOverviewPayload } from "@/src/types";
import grabCrewRole from "../access/grab-crew-role";
import grabExtensionAccess from "./grab-extension-access";
import grabExtensionTargets from "./grab-extension-targets";
import parseCustomToolRow from "./parse-custom-tool-row";

type Params = {
    user_id: number | string;
};

/**
 * The Tools settings page: every custom tool with who gets it, and what it
 * can be attached to. Its arguments and how it runs only go to the super
 * admin.
 */
export default async function grabToolsOverview({ user_id }: Params): Promise<CustomToolsOverviewPayload> {
    const role = await grabCrewRole({ user_id });
    const [rows, access, targets] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_CUSTOM_TOOLS>({ sql: `SELECT * FROM custom_tools ORDER BY name ASC, id ASC` }),
        grabExtensionAccess({ kind: "tool" }),
        grabExtensionTargets({ role }),
    ]);

    return {
        ...targets,
        tools: (rows.payload || []).map((row) => {
            const tool = parseCustomToolRow({ row });

            return {
                id: tool.id,
                name: tool.name,
                description: tool.description,
                kind: tool.kind,
                enabled: tool.enabled,
                status: tool.status,
                last_error: tool.last_error,
                last_checked_at: tool.last_checked_at,
                access: { all_bots: tool.all_bots, ...access(tool.id) },
                ...(targets.can_edit ? { parameters: tool.parameters, config: tool.config } : {}),
            };
        }),
    };
}
