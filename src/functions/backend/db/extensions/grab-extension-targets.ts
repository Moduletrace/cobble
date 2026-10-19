import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { ExtensionTargets } from "@/src/types";
import type { CrewRole } from "@/src/utils/rbac/crew-role";

type Params = {
    role: CrewRole;
};

/**
 * What an MCP server or tool can be attached to: every worker (and the
 * coordinator, for the super admin, who alone reaches it) and every
 * workspace not archived. Only the super admin edits.
 */
export default async function grabExtensionTargets({ role }: Params): Promise<ExtensionTargets> {
    const [bots, workspaces] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT id, name, role, kind FROM bots ${role == "super_admin" ? "" : `WHERE kind = 'worker'`}
                ORDER BY kind = 'coordinator' DESC, name COLLATE NOCASE ASC, id ASC`,
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT id, name FROM workspaces WHERE archived = 0 ORDER BY name COLLATE NOCASE ASC, id ASC`,
        }),
    ]);

    return {
        bots: (bots.payload || []).map((bot) => ({
            id: Number(bot.id),
            name: bot.name || `Bot ${bot.id}`,
            role: bot.role || "",
            kind: bot.kind || "worker",
        })),
        workspaces: (workspaces.payload || []).map((workspace) => ({
            id: Number(workspace.id),
            name: workspace.name || `Workspace ${workspace.id}`,
        })),
        can_edit: role == "super_admin",
    };
}
