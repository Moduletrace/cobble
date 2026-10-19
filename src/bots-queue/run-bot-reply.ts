import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { ChatReplyNote, CoordinatorReplyNote } from "@/src/data/harness-prompts";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import runTextLoop from "@/src/harness/text/run-text-loop";
import grabBotChatTools from "@/src/harness/tools/bot/grab-bot-chat-tools";
import botMessagesToHarness from "./bot-messages-to-harness";
import loadAttachmentParts from "./load-attachment-parts";
import type { BotJobContext, BotJobOutcome } from "./types";

type Params = BotJobContext & {
    bot: BUN_SQLITE_COBBLE_BOTS & { id: number; user_id: number };
};

/**
 * Answers the user in chat: the bot reads the recent conversation (and
 * the files of the latest messages, `loadAttachmentParts`) and
 * replies, with its chat tools (memory, instructions, start_task, and for
 * the coordinator delegate_task). Finishes silently when the last message
 * is already the bot's, i.e. an earlier reply answered everything.
 */
export default async function runBotReply({
    bot,
    job,
    signal,
}: Params): Promise<BotJobOutcome> {
    const history = await grabBotMessages({
        bot_id: bot.id,
        limit: AppData.BotReplyHistoryMessages,
    });

    if (history[history.length - 1]?.author != "user") {
        return { result: "", silent: true };
    }

    const prompt = await grabBotPrompt({ bot_id: bot.id, user_id: bot.user_id });

    const result = await runTextLoop({
        system: [
            prompt,
            ChatReplyNote,
            bot.kind == "coordinator" ? CoordinatorReplyNote : "",
            `Now: ${new Date().toUTCString()}.`,
        ]
            .filter(Boolean)
            .join("\n\n"),
        messages: botMessagesToHarness({
            messages: history,
            parts: await loadAttachmentParts({ messages: history }),
        }),
        tools: await grabBotChatTools({
            bot,
            user_id: bot.user_id,
            message_id: job.message_id || undefined,
        }),
        max_steps: AppData.BotReplyMaxToolSteps,
        bot_id: bot.id,
        signal,
    });

    return { result: result.text };
}
