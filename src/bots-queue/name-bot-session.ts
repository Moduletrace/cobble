import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import { SessionNamePrompt } from "@/src/data/harness-prompts";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import generateText from "@/src/harness/text/generate-text";
import parseSessionName from "./parse-session-name";

type Params = {
    session_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    signal?: AbortSignal;
};

/**
 * Names a session once its first exchange is in: the bot writes the title
 * the rail and sessions list show and a short summary of it. The summary
 * says how many messages it covers (`summary_message_count`), so
 * `grabSessionCarryOver` rewrites it before carrying a closed session into
 * the next one. Already named sessions are left as they are.
 *
 * Returns whether it wrote something.
 */
export default async function nameBotSession({
    session_id,
    bot_id,
    workspace_id,
    signal,
}: Params): Promise<boolean> {
    const session = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
            sql: `SELECT id, title, summary FROM bot_sessions WHERE id = ? LIMIT 1`,
            values: [session_id],
        })
    ).payload?.[0];

    if (!session?.id) return false;
    if (session.title?.trim() && session.summary?.trim()) return false;

    const messages = await grabBotMessages({
        session_id,
        limit: AppData.BotSessionNameMessages,
    });

    if (
        !messages.some((message) => message.author == "user") ||
        !messages.some((message) => message.author == "bot")
    ) {
        return false;
    }

    const transcript = messages
        .map(
            (message) =>
                `${message.author == "user" ? "User" : "You"}: ${message.text || "(files only)"}`,
        )
        .join("\n\n");

    const result = await generateText({
        messages: [
            { role: "system", content: SessionNamePrompt },
            { role: "user", content: transcript },
        ],
        bot_id,
        workspace_id,
        signal,
    });

    const name = parseSessionName({ text: result.text });

    if (!name) return false;

    const now = Date.now();
    const title = name.title.replace(/\s+/g, " ").trim().slice(0, AppData.BotSessionTitleMaxChars);
    const summary = name.summary.slice(0, AppData.BotSessionSummaryMaxChars);

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET
            title = CASE WHEN COALESCE(title, '') = '' THEN ? ELSE title END,
            summary = ?,
            summary_message_count = ?,
            updated_at = ?
            WHERE id = ?`,
        values: [title, summary, messages.length, now, session_id],
    });

    return true;
}
