import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { PreviousSessionNote, SessionSummaryPrompt } from "@/src/data/harness-prompts";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import generateText from "@/src/harness/text/generate-text";
import sessionNameTranscript from "./session-name-transcript";

type Params = {
    session_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    signal?: AbortSignal;
};

/**
 * The previous session's summary for a session's prompt (markdown), or ""
 * when it doesn't carry on from one. The summary written as the session
 * went covers only its first exchange, so a closed session whose summary
 * is stale (it covers fewer messages than the session ended with) is
 * summarized again from its latest messages, and kept.
 */
export default async function grabSessionCarryOver({
    session_id,
    bot_id,
    workspace_id,
    signal,
}: Params) {
    const previous = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS & { message_count: number }>({
            sql: `SELECT p.*,
                    (SELECT COUNT(*) FROM bot_messages m WHERE m.session_id = p.id) AS message_count
                FROM bot_sessions s JOIN bot_sessions p ON p.id = s.previous_session_id
                WHERE s.id = ? AND p.bot_id = s.bot_id LIMIT 1`,
            values: [session_id],
        })
    ).payload?.[0];

    if (!previous?.id) return "";

    const message_count = Number(previous.message_count) || 0;

    if (
        previous.summary?.trim() &&
        Number(previous.summary_message_count) >= message_count
    ) {
        return `${PreviousSessionNote}\n\n${previous.summary.trim()}`;
    }

    const messages = await grabBotMessages({
        session_id: previous.id,
        limit: AppData.BotSessionSummaryMessages,
    });

    if (!messages.length) return "";

    const transcript = sessionNameTranscript({ messages });

    const result = await generateText({
        messages: [
            { role: "system", content: SessionSummaryPrompt },
            { role: "user", content: transcript },
        ],
        bot_id,
        workspace_id,
        signal,
    }).catch((error: unknown) => {
        if (signal?.aborted) throw error;
        return null;
    });

    const summary = (result?.text || "").trim().slice(0, AppData.BotSessionSummaryMaxChars);

    /**
     * A model that can't rewrite it now must not lose what the earlier
     * one already said.
     */
    if (!summary) {
        return previous.summary?.trim()
            ? `${PreviousSessionNote}\n\n${previous.summary.trim()}`
            : "";
    }

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET summary = ?, summary_message_count = ?, updated_at = ? WHERE id = ?`,
        values: [summary, message_count, Date.now(), previous.id],
    });

    return `${PreviousSessionNote}\n\n${summary}`;
}
