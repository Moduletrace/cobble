import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import { SessionNamePrompt } from "@/src/data/harness-prompts";
import grabSessionOpening from "@/src/functions/backend/db/bot-sessions/grab-session-opening";
import generateText from "@/src/harness/text/generate-text";
import { runWithHarnessUsageScope } from "@/src/harness/usage/harness-usage-scope";
import parseSessionName from "./parse-session-name";
import sessionNameTranscript from "./session-name-transcript";

type Params = {
    session_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    signal?: AbortSignal;
};

/**
 * Names a session once its first exchange is in: the bot writes the title
 * the rail and sessions list show and a short summary of it, from the
 * session's first messages (however late the first reply came). The summary
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
            sql: `SELECT id, user_id, title, summary FROM bot_sessions WHERE id = ? LIMIT 1`,
            values: [session_id],
        })
    ).payload?.[0];

    if (!session?.id) return false;
    if (session.title?.trim() && session.summary?.trim()) return false;

    /**
     * The session's opening, not its latest messages: when the first
     * replies failed or were stopped, naming first runs well into the
     * session, and the title must still say what it was started for.
     */
    const messages = await grabSessionOpening({
        session_id,
        limit: AppData.BotSessionNameMessages,
    });

    if (
        !messages.some((message) => message.author == "user") ||
        !messages.some((message) => message.author == "bot" && !message.carried_from_session_id)
    ) {
        return false;
    }

    const transcript = sessionNameTranscript({ messages });

    /**
     * The naming turn is a model call too, so it is recorded for this
     * conversation. It runs after the job is complete, on purpose, so it
     * has no job and no message of its own to charge it to.
     */
    const result = await runWithHarnessUsageScope({
        scope: {
            user_id: session.user_id || undefined,
            bot_id,
            workspace_id: workspace_id || null,
            session_id: session.id,
            job_id: null,
            message_id: null,
        },
        task: () =>
            generateText({
                messages: [
                    { role: "system", content: SessionNamePrompt },
                    { role: "user", content: transcript },
                ],
                bot_id,
                workspace_id,
                signal,
            }),
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
