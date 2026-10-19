import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACE_BOTS } from "@/db/types/db";
import type { BotWorkspace } from "@/src/types";
import grabUserWorkspaces from "./grab-user-workspaces";

type Params = {
    user_id: number | string;
    bot: Pick<BUN_SQLITE_COBBLE_BOTS, "id" | "kind">;
};

/**
 * The workspaces a bot works in, for its settings page. The coordinator
 * works in every workspace; a worker only in the ones it was added to.
 * Each row carries what the bot has for that workspace alone.
 */
export default async function grabBotWorkspaces({
    user_id,
    bot,
}: Params): Promise<BotWorkspace[]> {
    const workspaces = await grabUserWorkspaces({ user_id });

    if (bot.kind == "coordinator") {
        return workspaces.map((workspace) => ({
            ...workspace,
            workspace_system_prompt: null,
            workspace_memory: null,
        }));
    }

    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACE_BOTS>({
                sql: `SELECT workspace_id, system_prompt, memory FROM workspace_bots WHERE bot_id = ?`,
                values: [Number(bot.id)],
            })
        ).payload || [];

    const by_workspace = new Map(rows.map((row) => [Number(row.workspace_id), row]));

    return workspaces
        .filter((workspace) => by_workspace.has(Number(workspace.id)))
        .map((workspace) => {
            const row = by_workspace.get(Number(workspace.id));

            return {
                ...workspace,
                workspace_system_prompt: row?.system_prompt || null,
                workspace_memory: row?.memory || null,
            };
        });
}
