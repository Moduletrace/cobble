import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { PreviousSessionNote, SessionSummaryPrompt } from "@/src/data/harness-prompts";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import generateText from "@/src/harness/text/generate-text";

type Params = {
    session_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    signal?: AbortSignal;
};

/**
 * The previous session's summary for a session's prompt (markdown), or ""
 * when it doesn't carry on from one. The summary is written the first
 * time it's needed and kept on that session.
 */
export default async function grabSessionCarryOver({
    session_id,
    bot_id,
    workspace_id,
    signal,
}: Params) {
    const previous = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
            sql: `SELECT p.* FROM bot_sessions s JOIN bot_sessions p ON p.id = s.previous_session_id
                WHERE s.id = ? AND p.bot_id = s.bot_id LIMIT 1`,
            values: [session_id],
        })
    ).payload?.[0];

    if (!previous?.id) return "";

    if (previous.summary?.trim()) {
        return `${PreviousSessionNote}\n\n${previous.summary.trim()}`;
    }

    const messages = await grabBotMessages({
        session_id: previous.id,
        limit: AppData.BotSessionSummaryMessages,
    });

    if (!messages.length) return "";

    const transcript = messages
        .map((message) => `${message.author == "user" ? "User" : "You"}: ${message.text || "(files only)"}`)
        .join("\n\n");

    const result = await generateText({
        messages: [
            { role: "system", content: SessionSummaryPrompt },
            { role: "user", content: transcript },
        ],
        bot_id,
        workspace_id,
        signal,
    });

    const summary = (result.text || "").trim().slice(0, AppData.BotSessionSummaryMaxChars);

    if (!summary) return "";

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET summary = ?, updated_at = ? WHERE id = ?`,
        values: [summary, Date.now(), previous.id],
    });

    return `${PreviousSessionNote}\n\n${summary}`;
}
