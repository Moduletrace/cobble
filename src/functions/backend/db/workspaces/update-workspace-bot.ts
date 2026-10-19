import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabWorkspaceBot from "./grab-workspace-bot";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    bot_id: number | string;
    /**
     * Only the fields given are changed: the bot's instructions and memory
     * for this workspace (markdown, whole-text replace).
     */
    system_prompt?: string;
    memory?: string;
};

/**
 * Rewrites what a bot has for one workspace alone: its instructions there
 * and its memory there. The bot, the coordinator and the user all can. The
 * coordinator gets its row on first write.
 */
export default async function updateWorkspaceBot({
    user_id,
    workspace_id,
    bot_id,
    system_prompt,
    memory,
}: Params) {
    assertPromptLength({ label: "Workspace instructions", text: system_prompt });
    assertPromptLength({ label: "Workspace memory", text: memory });

    const found = await grabWorkspaceBot({ workspace_id, bot_id, user_id });

    if (!found) {
        throw new AppError(`That bot isn't in this workspace.`);
    }

    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO workspace_bots (created_at, updated_at, workspace_id, bot_id) VALUES (?, ?, ?, ?)`,
        values: [now, now, found.workspace.id!, found.bot.id!],
    });

    if (system_prompt !== undefined) {
        await BunSQLite.sql({
            sql: `UPDATE workspace_bots SET system_prompt = ?, updated_at = ? WHERE workspace_id = ? AND bot_id = ?`,
            values: [system_prompt, now, found.workspace.id!, found.bot.id!],
        });
    }

    if (memory !== undefined) {
        await BunSQLite.sql({
            sql: `UPDATE workspace_bots SET memory = ?, updated_at = ? WHERE workspace_id = ? AND bot_id = ?`,
            values: [memory, now, found.workspace.id!, found.bot.id!],
        });
    }
}
