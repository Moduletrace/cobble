import BunSQLite from "@moduletrace/bun-sqlite";
import reachableBotsSql from "@/src/utils/crew-access/reachable-bots-sql";
import workspacesSql from "@/src/utils/crew-access/workspaces-sql";
import type { CrewRole } from "@/src/utils/rbac/crew-role";

type Params = {
    role: CrewRole;
    user_id: number | string;
};

export type ComputerFolderAccess = {
    /**
     * What `computerPathAllowed` needs about the user.
     */
    manages_crew: boolean;
    user_id: number;
    bot_ids: number[];
    workspace_ids: number[];
    /**
     * Names for the workspace's id folders (`bots/<id>`, `users/<id>`,
     * `workspaces/<id>`), the ones the user may see.
     */
    names: {
        bots: Record<string, string>;
        users: Record<string, string>;
        workspaces: Record<string, string>;
    };
};

/**
 * Which of a computer's workspace folders a user may open in the files
 * browser, and what they are called: the bots and workspaces they reach,
 * by the same crew SQL as the rest of the app. Crew managers see every
 * one, and every user's folder in them.
 */
export default async function grabComputerFolderAccess({
    role,
    user_id,
}: Params): Promise<ComputerFolderAccess> {
    const manages_crew = role != "member";
    const bot_access = reachableBotsSql({ role, user_id });
    const workspace_access = workspacesSql({ role, user_id });

    const [bots, workspaces, users] = await Promise.all([
        rows<{ id: number; name?: string | null }>({
            sql: `SELECT b.id, b.name FROM bots b WHERE ${bot_access.sql}`,
            values: bot_access.values,
        }),
        rows<{ id: number; name?: string | null }>({
            sql: `SELECT w.id, w.name FROM workspaces w WHERE ${workspace_access.sql}`,
            values: workspace_access.values,
        }),
        rows<{ id: number; first_name?: string | null; last_name?: string | null; username?: string | null }>({
            sql: `SELECT id, first_name, last_name, username FROM users${manages_crew ? "" : " WHERE id = ?"}`,
            values: manages_crew ? [] : [Number(user_id)],
        }),
    ]);

    return {
        manages_crew,
        user_id: Number(user_id),
        bot_ids: bots.map((bot) => Number(bot.id)),
        workspace_ids: workspaces.map((workspace) => Number(workspace.id)),
        names: {
            bots: Object.fromEntries(bots.map((bot) => [String(bot.id), bot.name || `Bot ${bot.id}`])),
            workspaces: Object.fromEntries(
                workspaces.map((workspace) => [String(workspace.id), workspace.name || `Workspace ${workspace.id}`]),
            ),
            users: Object.fromEntries(
                users.map((user) => [
                    String(user.id),
                    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || `User ${user.id}`,
                ]),
            ),
        },
    };
}

async function rows<T extends { [k: string]: any }>({
    sql,
    values,
}: {
    sql: string;
    values: (string | number)[];
}) {
    return (await BunSQLite.sql<T>({ sql, values })).payload || [];
}
