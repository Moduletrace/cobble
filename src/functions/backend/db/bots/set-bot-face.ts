import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFace } from "@/src/dict/bot-dict";

type Params = {
    bot_id: number | string;
    /**
     * The user who sees it: the one whose conversation the job is in.
     */
    user_id: number | string;
    face: BotFace;
    status_line?: string;
};

export type BotFaceChange = {
    id: number;
    user_id: number;
    face: BotFace;
    status_line: string;
};

/**
 * Sets a bot's face (its status) and status line as one user sees it
 * (`bot_user_faces`). Other users keep their own. Callers must check the
 * bot first.
 */
export default async function setBotFace({
    bot_id,
    user_id,
    face,
    status_line = "",
}: Params): Promise<BotFaceChange> {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT INTO bot_user_faces (created_at, updated_at, bot_id, user_id, face, status_line)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(bot_id, user_id) DO UPDATE SET face = excluded.face, status_line = excluded.status_line, updated_at = excluded.updated_at`,
        values: [now, now, bot_id, user_id, face, status_line],
    });

    return { id: Number(bot_id), user_id: Number(user_id), face, status_line };
}
