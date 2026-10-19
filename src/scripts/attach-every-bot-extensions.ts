import BunSQLite from "@moduletrace/bun-sqlite";
import attachToAllBots from "@/src/functions/backend/db/extensions/attach-to-all-bots";

/**
 * One-off, safe to run again: an MCP server or tool set to "every bot" used
 * to reach every bot without being given to it. Now "every bot" only
 * decides what bots are given, so this gives each of them to every bot
 * that exists, keeping what they had.
 *
 * Run once per install: `bun src/scripts/attach-every-bot-extensions.ts`.
 */
async function attachEveryBotExtensions() {
    const servers = await BunSQLite.sql<{ id: number }>({ sql: `SELECT id FROM mcp_servers WHERE all_bots = 1` });
    const tools = await BunSQLite.sql<{ id: number }>({ sql: `SELECT id FROM custom_tools WHERE all_bots = 1` });

    for (const row of servers.payload || []) await attachToAllBots({ kind: "mcp", id: row.id });
    for (const row of tools.payload || []) await attachToAllBots({ kind: "tool", id: row.id });

    console.log(
        `Gave ${servers.payload?.length || 0} MCP servers and ${tools.payload?.length || 0} tools to every bot.`,
    );
}

await attachEveryBotExtensions();
process.exit(0);
