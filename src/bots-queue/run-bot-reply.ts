import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import {
    ChatReplyNote,
    CoordinatorReplyNote,
    CoordinatorSoloNote,
    WorkspaceLearningNote,
} from "@/src/data/harness-prompts";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import runTextLoop from "@/src/harness/text/run-text-loop";
import grabBotChatTools from "@/src/harness/tools/bot/grab-bot-chat-tools";
import botMessagesToHarness from "./bot-messages-to-harness";
import composeComputersNote from "./compose-computers-note";
import grabSessionCarryOver from "./grab-session-carry-over";
import jobSessionId from "@/src/functions/backend/db/bots-queue/job-session-id";
import loadAttachmentParts from "./load-attachment-parts";
import withTakeOverRefs from "./with-take-over-refs";
import type { BotJobContext, BotJobOutcome } from "./types";

type Params = BotJobContext & {
    bot: BUN_SQLITE_COBBLE_BOTS & { id: number; user_id: number };
};

/**
 * Answers the user in chat: the bot reads the session's recent messages
 * (and the files of the latest ones, `loadAttachmentParts`) and replies,
 * knowing where it is (its workspace, if the session is in one), what
 * happened in the session before (`grabSessionCarryOver`) and its
 * computers (`composeComputersNote`), with its chat tools (memory,
 * instructions, start_task, and for the coordinator delegate_task).
 * Finishes silently when the last message is already the bot's, i.e. an
 * earlier reply answered everything.
 */
export default async function runBotReply({
    bot,
    job,
    signal,
    report,
}: Params): Promise<BotJobOutcome> {
    const session_id = await jobSessionId({ job });
    const workspace_id = job.workspace_id || null;

    const history = await grabBotMessages({
        session_id,
        limit: AppData.BotReplyHistoryMessages,
    });

    if (history[history.length - 1]?.author != "user") {
        return { result: "", silent: true };
    }

    const prompt = await grabBotPrompt({ bot_id: bot.id, user_id: bot.user_id, workspace_id });
    const computers = await grabBotComputers({ bot_id: bot.id, user_id: bot.user_id, workspace_id });

    /**
     * A summary that can't be written now (no model free) is left out
     * rather than holding up the reply.
     */
    const carry_over = await grabSessionCarryOver({
        session_id,
        bot_id: bot.id,
        workspace_id,
        signal,
    }).catch(() => "");

    const take_overs: string[] = [];

    const tools = await grabBotChatTools({
        bot,
        user_id: bot.user_id,
        computers,
        session_id,
        workspace_id,
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
            carry_over,
            ChatReplyNote,
            workspace_id ? WorkspaceLearningNote : "",
            composeComputersNote({
                computers,
                is_coordinator: bot.kind == "coordinator",
                in_workspace: Boolean(workspace_id),
            }),
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
        workspace_id,
        signal,
        onStep: report,
    });

    return withTakeOverRefs({ text: result.text, refs: take_overs });
}
