import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { ChatReplyNote, CoordinatorReplyNote, CoordinatorSoloNote } from "@/src/data/harness-prompts";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import runTextLoop from "@/src/harness/text/run-text-loop";
import grabBotChatTools from "@/src/harness/tools/bot/grab-bot-chat-tools";
import botMessagesToHarness from "./bot-messages-to-harness";
import composeComputersNote from "./compose-computers-note";
import loadAttachmentParts from "./load-attachment-parts";
import withTakeOverRefs from "./with-take-over-refs";
import type { BotJobContext, BotJobOutcome } from "./types";

type Params = BotJobContext & {
    bot: BUN_SQLITE_COBBLE_BOTS & { id: number; user_id: number };
};

/**
 * Answers the user in chat: the bot reads the recent conversation (and
 * the files of the latest messages, `loadAttachmentParts`) and
 * replies, knowing its computers (`composeComputersNote`), with its chat tools (memory, instructions, start_task, and for
 * the coordinator delegate_task). Finishes silently when the last message
 * is already the bot's, i.e. an earlier reply answered everything.
 */
export default async function runBotReply({
    bot,
    job,
    signal,
    report,
}: Params): Promise<BotJobOutcome> {
    const history = await grabBotMessages({
        bot_id: bot.id,
        limit: AppData.BotReplyHistoryMessages,
    });

    if (history[history.length - 1]?.author != "user") {
        return { result: "", silent: true };
    }

    const prompt = await grabBotPrompt({ bot_id: bot.id, user_id: bot.user_id });
    const computers = await grabBotComputers({ bot_id: bot.id, user_id: bot.user_id });

    const take_overs: string[] = [];

    const tools = await grabBotChatTools({
        bot,
        user_id: bot.user_id,
        computers,
        message_id: job.message_id || undefined,
        onTakeOver: ({ ref }) => take_overs.push(ref),
    });

    /**
     * delegate_task is only there while the coordinator has workers.
     */
    const crew_note =
        bot.kind != "coordinator"
            ? ""
            : tools.some((tool) => tool.name == "delegate_task")
              ? CoordinatorReplyNote
              : CoordinatorSoloNote;

    const result = await runTextLoop({
        system: [
            prompt,
            ChatReplyNote,
            composeComputersNote({ computers, is_coordinator: bot.kind == "coordinator" }),
            crew_note,
            `Now: ${new Date().toUTCString()}.`,
        ]
            .filter(Boolean)
            .join("\n\n"),
        messages: botMessagesToHarness({
            messages: history,
            parts: await loadAttachmentParts({ messages: history }),
        }),
        tools,
        max_steps: AppData.BotReplyMaxToolSteps,
        bot_id: bot.id,
        signal,
        onStep: report,
    });

    return withTakeOverRefs({ text: result.text, refs: take_overs });
}
