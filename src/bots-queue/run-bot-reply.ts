import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import {
    ActionCheckNote,
    BotFilesNote,
    ChatReplyNote,
    ComputerFilesNote,
    CoordinatorReplyNote,
    CoordinatorSoloNote,
    TasksNote,
    TaskReminderNote,
    WorkspaceLearningNote,
} from "@/src/data/harness-prompts";
import { grabReplyMaxToolSteps } from "@/src/functions/backend/db/app-settings/grab-run-limits";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import runTextLoop from "@/src/harness/text/run-text-loop";
import grabBotChatTools from "@/src/harness/tools/bot/grab-bot-chat-tools";
import grabBotFileTools from "@/src/harness/tools/storage/grab-bot-file-tools";
import grabRunScopes from "@/src/functions/backend/db/bot-files/grab-run-scopes";
import openBotExtensions from "@/src/harness/tools/extensions/open-bot-extensions";
import openBotSkills from "@/src/harness/tools/skills/open-bot-skills";
import botMessagesToHarness from "./bot-messages-to-harness";
import composeComputersNote from "./compose-computers-note";
import grabSessionCarryOver from "./grab-session-carry-over";
import jobSessionId from "@/src/functions/backend/db/bots-queue/job-session-id";
import loadAttachmentParts from "./load-attachment-parts";
import grabMessageRefNames from "@/src/functions/backend/db/bots/grab-message-ref-names";
import withTakeOverRefs from "./with-take-over-refs";
import type { BotJobContext, BotJobOutcome } from "./types";

type Params = BotJobContext & {
    bot: BUN_SQLITE_COBBLE_BOTS & { id: number };
    /**
     * The user whose conversation the job is in.
     */
    user_id: number;
};

/**
 * Answers the user in chat: the bot reads the session's recent messages
 * (and the files of the latest ones, `loadAttachmentParts`) and replies,
 * knowing where it is (its workspace, if the session is in one), what
 * happened in the session before (`grabSessionCarryOver`) and its
 * computers (`composeComputersNote`), with its chat tools (memory,
 * instructions, start_task, and for the coordinator delegate_task) plus
 * its MCP servers' and custom tools (`openBotExtensions`, script tools on
 * its current computer).
 * Finishes silently when the last message is already the bot's, i.e. an
 * earlier reply answered everything.
 */
export default async function runBotReply({
    bot,
    user_id,
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

    const prompt = await grabBotPrompt({ bot_id: bot.id, user_id, workspace_id });
    const computers = await grabBotComputers({ bot_id: bot.id, workspace_id });

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
    /**
     * Files the bot wrote and asked to send with its reply.
     */
    const attachments: number[] = [];

    /**
     * The files this run reaches: its file tools and the pictures it may
     * set work from the same answer (`grabRunScopes`).
     */
    const scopes = await grabRunScopes({ bot, user_id, workspace_id });

    const file_tools = await grabBotFileTools({
        bot,
        user_id,
        workspace_id,
        session_id,
        scopes,
        onAttach: ({ media_id }) => attachments.push(media_id),
    });

    const tools = await grabBotChatTools({
        bot,
        user_id,
        computers,
        session_id,
        workspace_id,
        scopes,
        message_id: job.message_id || undefined,
        onTakeOver: ({ ref }) => take_overs.push(ref),
    });

    const extensions = await openBotExtensions({
        bot_id: bot.id,
        workspace_id,
        computer_id: computers[0]?.id || null,
        taken: tools.map((tool) => tool.name),
        signal,
    });

    /**
     * The run's skills: one `load_skill` tool and the lines that name them.
     */
    const skills = openBotSkills({
        skills: extensions.skills,
        taken: [...tools, ...extensions.tools].map((tool) => tool.name),
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

    try {
        const result = await runTextLoop({
            system: [
                prompt,
                carry_over,
                ChatReplyNote,
                BotFilesNote,
                ComputerFilesNote({ computer_id: computers[0]?.id || 0, can_import: false }),
                TasksNote,
                TaskReminderNote,
                ActionCheckNote,
                workspace_id ? WorkspaceLearningNote : "",
                composeComputersNote({
                    computers,
                    is_coordinator: bot.kind == "coordinator",
                    in_workspace: Boolean(workspace_id),
                }),
                crew_note,
                skills.note,
                extensions.note,
                `Now: ${new Date().toUTCString()}.`,
            ]
                .filter(Boolean)
                .join("\n\n"),
            messages: botMessagesToHarness({
                messages: history,
                parts: await loadAttachmentParts({ messages: history }),
                refs: await grabMessageRefNames({
                    texts: history.filter((m) => m.author == "user").map((m) => m.text || ""),
                    user_id,
                }),
            }),
            tools: [...tools, ...file_tools, ...extensions.tools, ...skills.tools],
            max_steps: await grabReplyMaxToolSteps(),
            bot_id: bot.id,
            workspace_id,
            signal,
            onStep: report,
        });

        return {
            ...withTakeOverRefs({ text: result.text, refs: take_overs }),
            attachments: attachments.length ? attachments : undefined,
        };
    } finally {
        await extensions.close();
    }
}
