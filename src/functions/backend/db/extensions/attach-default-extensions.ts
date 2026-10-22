import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
};

/**
 * Gives a new bot every MCP server, tool and skill set to "every bot".
 * Called when a bot is created; it can drop any of them afterwards.
 */
export default async function attachDefaultExtensions({ bot_id }: Params) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_mcp_servers (created_at, updated_at, bot_id, mcp_server_id)
            SELECT ?, ?, ?, id FROM mcp_servers WHERE all_bots = 1`,
        values: [now, now, Number(bot_id)],
    });

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_custom_tools (created_at, updated_at, bot_id, custom_tool_id)
            SELECT ?, ?, ?, id FROM custom_tools WHERE all_bots = 1`,
        values: [now, now, Number(bot_id)],
    });

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_skills (created_at, updated_at, bot_id, skill_id)
            SELECT ?, ?, ?, id FROM skills WHERE all_bots = 1`,
        values: [now, now, Number(bot_id)],
    });
}
