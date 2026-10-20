import BunSQLite from "@moduletrace/bun-sqlite";

export type BotSavedTextKind =
    | "core_memory"
    | "core_instructions"
    | "user_memory"
    | "workspace_memory"
    | "workspace_instructions";

type Params = {
    kind: BotSavedTextKind;
    bot_id: number | string;
    /**
     * Whose memory, for `user_memory`.
     */
    user_id?: number | string;
    /**
     * Which workspace, for the workspace kinds.
     */
    workspace_id?: number | string | null;
};

/**
 * Reads back one of a bot's memories or instructions as stored, so a save
 * can be checked. Empty when there's none. The caller checks access.
 */
export default async function grabBotSavedText({ kind, bot_id, user_id, workspace_id }: Params) {
    const query =
        kind == "core_memory"
            ? { sql: `SELECT memory AS text FROM bots WHERE id = ?`, values: [bot_id] }
            : kind == "core_instructions"
              ? { sql: `SELECT system_prompt AS text FROM bots WHERE id = ?`, values: [bot_id] }
              : kind == "user_memory"
                ? {
                      sql: `SELECT memory AS text FROM bot_user_memories WHERE bot_id = ? AND user_id = ?`,
                      values: [bot_id, user_id ?? 0],
                  }
                : {
                      sql: `SELECT ${kind == "workspace_memory" ? "memory" : "system_prompt"} AS text
                          FROM workspace_bots WHERE bot_id = ? AND workspace_id = ?`,
                      values: [bot_id, workspace_id ?? 0],
                  };

    const res = await BunSQLite.sql<{ text: string | null }>({ ...query, sql: `${query.sql} LIMIT 1` });

    return res.payload?.[0]?.text || "";
}
