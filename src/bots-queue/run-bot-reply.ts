import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { grabSkillBodyShownChars } from "@/src/functions/backend/db/app-settings/grab-skill-limits";
import { AppData } from "@/src/data/app-data";
import {
    ActionCheckNote,
    QuestionsNote,
    AskCrewNote,
    SecretsNote,
    GraphicsNote,
    botFilesNote,
    chatReplyNote,
    ComputerFilesNote,
    coordinatorReplyNote,
    longSessionNote,
    CoordinatorSoloNote,
    TasksNote,
    TaskReminderNote,
    workspaceAdminNote,
    WorkspaceLearningNote,
    openRunsNote,
} from "@/src/data/harness-prompts";
import grabBotRunPowers from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";
import workspaceAdminsNote from "./workspace-admins-note";
import type { WorkspaceAdminTools } from "@/src/harness/tools/bot/grab-workspace-admin-tools";
import { grabContextBudgetTokens, grabReplyMaxToolSteps, grabRunMaxPromptTokens } from "@/src/functions/backend/db/app-settings/grab-run-limits";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import runTextLoop from "@/src/harness/text/run-text-loop";
import grabBotChatTools from "@/src/harness/tools/bot/grab-bot-chat-tools";
import grabBotFileTools from "@/src/harness/tools/storage/grab-bot-file-tools";
import grabBotGraphicTools from "@/src/harness/tools/graphics/grab-bot-graphic-tools";
import grabRunScopes from "@/src/functions/backend/db/bot-files/grab-run-scopes";
import openBotBrowsers from "@/src/harness/tools/browsers/open-bot-browsers";
import openBotExtensions from "@/src/harness/tools/extensions/open-bot-extensions";
import isHiddenSession from "@/src/functions/backend/db/bot-sessions/is-hidden-session";
import openBotSkills from "@/src/harness/tools/skills/open-bot-skills";
import openBotKnowledgebases from "@/src/harness/tools/knowledgebases/open-bot-knowledgebases";
import grabKnowledgebaseContext from "@/src/harness/tools/knowledgebases/grab-knowledgebase-context";
import messagesToTurns from "./messages-to-turns";
import grabOpenSessionRuns from "@/src/functions/backend/db/bots-queue/grab-open-session-runs";
import composeBrowsersNote from "./compose-browsers-note";
import composeComputersNote from "./compose-computers-note";
import composeEnvsNote from "./compose-envs-note";
import grabReachableEnvs from "@/src/functions/backend/db/envs/grab-reachable-envs";
import grabSessionCarryOver from "./grab-session-carry-over";
import continueInNewSessionTool from "@/src/harness/tools/bot/continue-in-new-session-tool";
import searchPastSessionsTool from "@/src/harness/tools/bot/sessions/search-past-sessions-tool";
import readPastSessionTool from "@/src/harness/tools/bot/sessions/read-past-session-tool";
import { grabBotSessionMaxMessages } from "@/src/functions/backend/db/app-settings/grab-bot-session-max-messages";
import BunSQLite from "@moduletrace/bun-sqlite";
import jobSessionId from "@/src/functions/backend/db/bots-queue/job-session-id";
import withTakeOverRefs from "./with-take-over-refs";
import stripAppRecords from "@/src/utils/strip-app-records";
import hasUnansweredMessage from "./has-unanswered-message";
import reviewBotReply from "./review-bot-reply";
import grabAnsweredMessageId from "@/src/functions/backend/db/bots-queue/grab-answered-message-id";
import markReplyAnswered from "@/src/functions/backend/db/bots-queue/mark-reply-answered";
import sendMessageTool from "@/src/harness/tools/bot/send-message-tool";
import grabBotSecretTools from "@/src/harness/tools/bot/secrets/grab-bot-secret-tools";
import askUserTool from "@/src/harness/tools/bot/questions/ask-user-tool";
import type { BotMessageWithAttachments } from "@/src/types";
import type { HarnessMessage } from "@/src/harness/types";
import type { BotJobContext, BotJobOutcome } from "./types";
import computerRunDirs from "@/src/utils/computer-work-dirs";

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
 * Messages the user sends while it works join the run (`incoming`): one
 * that changes the work changes the answer before it goes out, and one
 * that's separate can be acknowledged at once (`send_message`) and done
 * after the current work. Runs open in the session take in what the user
 * writes too (`openRunsNote`), so a correction to one starts no other.
 * The job records the newest one it read (`markReplyAnswered`). Finishes silently when an earlier
 * reply already read everything (`hasUnansweredMessage`). An answer naming
 * files or tasks that don't exist, or saying work is under way when none
 * is, is written again once (`reviewBotReply`).
 */
export default async function runBotReply({
    bot,
    user_id,
    job,
    signal,
    report,
}: Params): Promise<BotJobOutcome> {
    /**
     * Moves when the bot carries the conversation into a new session
     * (`continue_in_new_session`): what the user writes from then on
     * lands there.
     */
    let session_id = await jobSessionId({ job });
    const workspace_id = job.workspace_id || null;

    const history = await grabBotMessages({
        session_id,
        limit: AppData.BotReplyHistoryMessages,
        user_id,
    });

    const answered_id = await grabAnsweredMessageId({ session_id });

    if (!hasUnansweredMessage({ history, answered_id })) {
        return { result: "", silent: true };
    }

    /**
     * The newest message the run has read, and of those the newest user
     * message, which is what the reply answers.
     */
    let seen_id = Math.max(0, ...history.map((message) => Number(message.id)));
    let answering_id = newestUserMessageId({ messages: history });

    /**
     * What the user wrote since the run last looked.
     */
    const incoming = async (): Promise<HarnessMessage[]> => {
        const fresh = await grabBotMessages({
            session_id,
            after_id: seen_id,
            author: "user",
            limit: AppData.BotReplyHistoryMessages,
        });

        if (!fresh.length) return [];

        seen_id = Math.max(seen_id, ...fresh.map((message) => Number(message.id)));
        answering_id = Math.max(answering_id, newestUserMessageId({ messages: fresh }));

        return await messagesToTurns({ messages: fresh, user_id });
    };

    const prompt = await grabBotPrompt({ bot_id: bot.id, user_id, workspace_id });
    const computers = await grabBotComputers({ bot_id: bot.id, workspace_id });

    /**
     * The envs the reply has (keys only), so it doesn't ask for or test
     * ones that are set.
     */
    const envs = await grabReachableEnvs({
        bot_id: bot.id!,
        user_id,
        workspace_id,
        computer_id: computers[0]?.id || null,
    });

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

    /**
     * From halfway to the session's length, the bot is told to move on
     * at a natural break.
     */
    const session_messages =
        Number(
            (
                await BunSQLite.sql<{ n: number }>({
                    sql: `SELECT COUNT(*) AS n FROM bot_messages WHERE session_id = ?`,
                    values: [session_id],
                })
            ).payload?.[0]?.n,
        ) || 0;
    const session_max = await grabBotSessionMaxMessages();
    const long_session_note =
        session_messages >= Math.ceil(session_max / 2)
            ? longSessionNote({ messages: session_messages, max: session_max })
            : "";

    /**
     * The conversation's earlier sessions are searchable when it has any:
     * the prompt only carries the last one's summary.
     */
    const past_scope = { user_id, bot_id: bot.id!, workspace_id, current_session_id: session_id };
    const has_past_sessions = Boolean(
        (
            await BunSQLite.sql({
                sql: `SELECT id FROM bot_sessions WHERE user_id = ? AND bot_id = ? AND workspace_id IS ? AND id != ? AND chatroom_id IS NULL AND hook_id IS NULL LIMIT 1`,
                values: [user_id, bot.id!, workspace_id ? Number(workspace_id) : null, session_id],
            })
        ).payload?.[0],
    );

    const take_overs: string[] = [];
    /**
     * The hooks the bot proposed, and the MCP servers, tools and skills the
     * coordinator did: their cards need the user just like a take-over.
     */
    const proposals: string[] = [];
    /**
     * The secrets the bot showed (`show_secret`) and the graphics it made
     * or changed, whose chips the reply always carries.
     */
    const shown: string[] = [];
    /**
     * Files the bot wrote and asked to send with its reply.
     */
    const attachments: number[] = [];
    /**
     * The tracker tasks the reply worked on, linked under it.
     */
    const task_ids: number[] = [];

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

    /**
     * What the bot's types let it do here, and what it leads when it's this
     * workspace's admin.
     */
    const powers = await grabBotRunPowers({ bot_id: bot.id, workspace_id });
    /**
     * A chatroom's turn is a reply too, and nobody follows that.
     */
    const attended = !(await isHiddenSession({ session_id }));
    let led: WorkspaceAdminTools | null = null;

    const tools = await grabBotChatTools({
        bot,
        powers,
        user_id,
        computers,
        session_id,
        workspace_id,
        scopes,
        attended,
        message_id: job.message_id || undefined,
        onTakeOver: ({ ref }) => take_overs.push(ref),
        onPropose: ({ ref }) => proposals.push(ref),
        onWorkspaceAdmin: (admin) => {
            led = admin;
        },
        onChatroom: ({ ref }) => shown.push(ref),
        onTask: ({ task_id }) => task_ids.push(task_id),
    });

    /**
     * Where the run works on a computer: the user's folder in the bot's.
     */
    const dirs = computerRunDirs({ bot_id: bot.id, bot_kind: bot.kind, user_id, workspace_id });

    const extensions = await openBotExtensions({
        bot_id: bot.id,
        user_id,
        workspace_id,
        computer_id: computers[0]?.id || null,
        dirs,
        taken: tools.map((tool) => tool.name),
        signal,
    });

    /**
     * The user's own browsers, so a bot can browse from the chat with no
     * computer.
     */
    const browser_run_kind = attended ? "attended" : "unattended";
    const browsers = await openBotBrowsers({
        user_id,
        bot_id: bot.id,
        workspace_id,
        run_kind: browser_run_kind,
        taken: [...tools, ...extensions.tools].map((tool) => tool.name),
        signal,
    });

    /**
     * The run's skills: one `load_skill` tool and the lines that name them.
     */
    const skills = openBotSkills({
        skills: extensions.skills,
        shown_chars: await grabSkillBodyShownChars(),
        taken: [...tools, ...extensions.tools, ...browsers.tools].map((tool) => tool.name),
    });

    /**
     * The run's knowledgebases: a search tool and a reader, and the
     * passages found for what the user just asked, so a plain question is
     * answered from the documents.
     */
    const knowledge = openBotKnowledgebases({
        knowledgebases: extensions.knowledgebases,
        taken: [...tools, ...extensions.tools, ...browsers.tools, ...skills.tools].map((tool) => tool.name),
    });
    const knowledge_context = await grabKnowledgebaseContext({
        knowledgebases: extensions.knowledgebases,
        ids: knowledge.ids,
        query: unansweredText({ messages: history, answered_id }),
        signal,
    });

    /**
     * delegate_task is only there while the coordinator, or a workspace's
     * admin, has bots to hand work to. Anyone else in a workspace with an
     * admin is told who leads it.
     */
    const can_delegate = tools.some((tool) => tool.name == "delegate_task");
    const lead = led as WorkspaceAdminTools | null;
    const crew_note = powers.is_coordinator
        ? can_delegate
            ? coordinatorReplyNote({ bot_id: bot.id })
            : CoordinatorSoloNote
        : lead?.workspace && can_delegate
          ? workspaceAdminNote({ workspace_name: lead.workspace.name || "this workspace", members: lead.members })
          : await workspaceAdminsNote({ bot_id: bot.id, workspace_id });

    /**
     * The bot's runs open here hear what the user writes: a correction to
     * one reaches it, so the reply doesn't start another.
     */
    const open_runs = attended ? await grabOpenSessionRuns({ bot_id: bot.id, session_id }) : [];

    try {
        const result = await runTextLoop({
            system: [
                prompt,
                carry_over,
                long_session_note,
                chatReplyNote({ bot_id: bot.id }),
                botFilesNote({ bot_id: bot.id }),
                ComputerFilesNote({ computer_id: computers[0]?.id || 0, dirs, can_import: false }),
                TasksNote,
                TaskReminderNote,
                ActionCheckNote,
                QuestionsNote,
                SecretsNote,
                composeEnvsNote({ ...envs, has_computer: computers.length > 0 }),
                GraphicsNote,
                workspace_id ? WorkspaceLearningNote : "",
                composeComputersNote({
                    computers,
                    is_coordinator: powers.is_coordinator,
                    in_workspace: Boolean(workspace_id),
                    has_browser: browsers.browsers.length > 0,
                }),
                composeBrowsersNote({
                    browsers: browsers.browsers,
                    has_computer_browser: computers.length > 0,
                    run_kind: browser_run_kind,
                }),
                crew_note,
                openRunsNote({ runs: open_runs }),
                powers.is_coordinator ? "" : AskCrewNote,
                skills.note,
                knowledge.note,
                extensions.note,
                knowledge_context,
                `Now: ${new Date().toUTCString()}.`,
            ]
                .filter(Boolean)
                .join("\n\n"),
            messages: await messagesToTurns({ messages: history, user_id }),
            tools: [
                ...tools,
                sendMessageTool({ bot_id: bot.id, session_id: Number(session_id), workspace_id }),
                continueInNewSessionTool({
                    bot_id: bot.id!,
                    user_id,
                    session_id: Number(session_id),
                    workspace_id,
                    job_id: job.id || null,
                    onMove: (moved) => {
                        session_id = moved.session_id;
                    },
                }),
                ...grabBotSecretTools({
                    user_id,
                    bot_id: bot.id,
                    session_id,
                    workspace_id,
                    computer_id: computers[0]?.id || null,
                    onRequest: ({ ref }) => proposals.push(ref),
                    onShow: ({ ref }) => shown.push(ref),
                }),
                askUserTool({
                    user_id,
                    bot_id: bot.id,
                    session_id,
                    workspace_id,
                    onAsk: ({ ref }) => proposals.push(ref),
                }),
                ...(has_past_sessions
                    ? [searchPastSessionsTool(past_scope), readPastSessionTool(past_scope)]
                    : []),
                ...file_tools,
                ...grabBotGraphicTools({
                    bot_id: bot.id,
                    user_id,
                    session_id,
                    workspace_id,
                    job_id: job.id || null,
                    onGraphic: ({ ref }) => shown.push(ref),
                }),
                ...extensions.tools,
                ...browsers.tools,
                ...skills.tools,
                ...knowledge.tools,
            ],
            max_steps: await grabReplyMaxToolSteps(),
            max_prompt_tokens: await grabRunMaxPromptTokens(),
            context_budget: await grabContextBudgetTokens(),
            bot_id: bot.id,
            workspace_id,
            signal,
            onStep: report,
            incoming,
            /**
             * Files, tasks and work the answer names are checked against
             * the app's record before it goes out.
             */
            review: ({ text, tool_uses }) =>
                reviewBotReply({ text, tool_uses, bot_id: bot.id!, user_id, session_id, scopes }),
        });

        if (job.id && answering_id) {
            await markReplyAnswered({ job_id: job.id, message_id: answering_id });
        }

        return {
            ...withTakeOverRefs({
                text: stripAppRecords({ text: result.text }),
                refs: [...take_overs, ...proposals],
                shown,
            }),
            attachments: attachments.length ? attachments : undefined,
            tool_log: result.tool_uses,
            task_ids,
        };
    } finally {
        await extensions.close();
        await browsers.close();
    }
}

function newestUserMessageId({ messages }: { messages: Pick<BotMessageWithAttachments, "id" | "author">[] }) {
    return Math.max(
        0,
        ...messages.filter((message) => message.author == "user").map((message) => Number(message.id)),
    );
}

/**
 * The text of the user messages the reply answers (those after the last
 * answered one), else the newest user message: what the knowledgebases are
 * searched for ahead of the reply.
 */
function unansweredText({
    messages,
    answered_id,
}: {
    messages: Pick<BotMessageWithAttachments, "id" | "author" | "text">[];
    answered_id?: number | string | null;
}) {
    const from_user = messages.filter((message) => message.author == "user");
    const unanswered = from_user.filter((message) => Number(message.id) > Number(answered_id || 0));
    const picked = unanswered.length ? unanswered : from_user.slice(-1);

    return picked.map((message) => message.text || "").join("\n");
}
