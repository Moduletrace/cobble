import { AppData } from "@/src/data/app-data";
import { SessionContinuePrompt } from "@/src/data/harness-prompts";
import parseSessionName from "@/src/bots-queue/parse-session-name";
import sessionNameTranscript from "@/src/bots-queue/session-name-transcript";
import generateText from "@/src/harness/text/generate-text";
import { runWithHarnessUsageScope } from "@/src/harness/usage/harness-usage-scope";
import grabBotMessages from "../bots/grab-bot-messages";

type Params = {
    session_id: number | string;
    user_id: number | string;
    bot_id: number;
    workspace_id?: number | null;
};

/**
 * Has the bot's text model write what a session's next one needs to carry
 * on: its title and a summary of its latest messages (`SessionContinuePrompt`).
 * Null when the session has no messages or the model wrote no summary.
 * `continueBotSession` and the rollover of a routine's or hook's own
 * thread both carry this into a new session.
 */
export default async function writeSessionContinuation({
    session_id,
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<{ summary: string; title: string } | null> {
    const messages = await grabBotMessages({
        session_id,
        limit: AppData.BotSessionSummaryMessages,
    });

    if (!messages.length) return null;

    const result = await runWithHarnessUsageScope({
        scope: {
            user_id,
            bot_id,
            workspace_id: workspace_id || null,
            session_id: Number(session_id),
            job_id: null,
            message_id: null,
        },
        task: () =>
            generateText({
                messages: [
                    { role: "system", content: SessionContinuePrompt },
                    { role: "user", content: sessionNameTranscript({ messages }) },
                ],
                bot_id,
                workspace_id,
            }),
    });

    const written = parseSessionName({ text: result.text });

    return written?.summary ? written : null;
}