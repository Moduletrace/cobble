import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { grabSkillBodyShownChars } from "@/src/functions/backend/db/app-settings/grab-skill-limits";
import { AppData } from "@/src/data/app-data";
import {
    ActionCheckNote,
    RequestScopeNote,
    QuestionsNote,
    AskRulesNote,
    passedOnRequestNote,
    SecretsNote,
    SettingsNote,
    GraphicsNote,
    botFilesNote,
    chatReplyNote,
    RerunReplyNote,
    ComputerFilesNote,
    coordinatorReplyNote,
    longSessionNote,
    CoordinatorSoloNote,
    TasksNote,
    TaskReminderNote,
    HandOverTaskNote,
    workspaceAdminNote,
    WorkspaceLearningNote,
    openRunsNote,
    PlansNote,
    PlanWaitingNote,
    PlanStepNote,
    PlanActiveNote,
    PlanPausedNote,
} from "@/src/data/harness-prompts";
import grabBotRunPowers from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";
import workspaceAdminsNote from "./workspace-admins-note";
import type { WorkspaceAdminTools } from "@/src/harness/tools/bot/grab-workspace-admin-tools";
import { grabContextBudgetTokens, grabReplyMaxToolSteps, grabRunMaxPromptTokens } from "@/src/functions/backend/db/app-settings/grab-run-limits";
import { isUnlimitedLimit } from "@/src/utils/run-limit";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import BotJobFatalError from "@/src/bots-queue/bot-job-fatal-error";
import runTextLoop from "@/src/harness/text/run-text-loop";
import grabBotChatTools from "@/src/harness/tools/bot/grab-bot-chat-tools";
import grabBotFileTools from "@/src/harness/tools/storage/grab-bot-file-tools";
import grabBotGraphicTools from "@/src/harness/tools/graphics/grab-bot-graphic-tools";
import grabRunScopes from "@/src/functions/backend/db/bot-files/grab-run-scopes";
import openBotBrowsers from "@/src/harness/tools/browsers/open-bot-browsers";
import openBotExtensions from "@/src/harness/tools/extensions/open-bot-extensions";
import isHiddenSession from "@/src/functions/backend/db/bot-sessions/is-hidden-session";
import grabSessionAskId from "@/src/functions/backend/db/bot-sessions/grab-session-ask-id";
import grabOpenAskBySession from "@/src/functions/backend/db/asks/grab-open-ask-by-session";
import deleteBotQuestion from "@/src/functions/backend/db/bot-questions/delete-bot-question";
import parseJobJson from "./parse-job-json";
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
import reviewRunAnswer from "./review-run-answer";
import cancelBotJob from "@/src/functions/backend/db/bots-queue/cancel-bot-job";
import grabAnsweredMessageId from "@/src/functions/backend/db/bots-queue/grab-answered-message-id";
import markReplyAnswered from "@/src/functions/backend/db/bots-queue/mark-reply-answered";
import sendMessageTool from "@/src/harness/tools/bot/send-message-tool";
import updateRequesterTool from "@/src/harness/tools/bot/update-requester-tool";
import grabBotSecretTools from "@/src/harness/tools/bot/secrets/grab-bot-secret-tools";
import askUserTool from "@/src/harness/tools/bot/questions/ask-user-tool";
import suggestNextStepsTool from "@/src/harness/tools/bot/suggestions/suggest-next-steps-tool";
import grabBotPlanTools from "@/src/harness/tools/bot/plans/grab-bot-plan-tools";
import grabSessionPlan from "@/src/functions/backend/db/bot-plans/grab-session-plan";
import grabBotPlan from "@/src/functions/backend/db/bot-plans/grab-bot-plan";
import toBotPlanView from "@/src/functions/backend/db/bot-plans/to-bot-plan-view";
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
 * instructions, send_reply with its work, and for the coordinator delegate_task) plus
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
 * is, is written again (`reviewRunAnswer`, up to `AppData.HarnessReviewRewrites`).
 */
export default async function runBotReply({
    bot,
    user_id,
    job,
    signal,
    report,
    trace,
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

    const job_params = parseJobJson({ text: job.params }) || {};
    /**
     * The plan this job was queued for (`enqueuePlanStep`): the run works
     * that plan's current step, whether or not the user wrote anything.
     */
    const on_plan_step = Number(job_params.plan_id) > 0;
    /**
     * A retried reply (`retry-reply`): the user asked for the answer again
     * after a failure, so it runs even when the failure notice is the
     * session's last message and nothing looks unanswered.
     */
    const is_retry = Number(job_params.retry_of) > 0;

    if (!on_plan_step && !is_retry && !hasUnansweredMessage({ history, answered_id })) {
        return { result: "", silent: true };
    }

    /**
     * The conversation's plan: the one this job works, else the one open
     * here, which the run reads and reports on.
     */
    const plan_row = on_plan_step
        ? await grabBotPlan({ plan_id: Number(job_params.plan_id) }).catch(() => null)
        : await grabSessionPlan({ session_id });
    const plan = plan_row ? toBotPlanView({ row: plan_row }) : null;

    /**
     * A step job queued before the user paused (or dropped) the plan has
     * nothing to do: it ends without a word, rather than reporting a step
     * nobody asked for any more.
     */
    if (on_plan_step && (plan?.status != "active" || plan?.current_step == null)) {
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
    const incoming = async ({ counted = true }: { counted?: boolean } = {}): Promise<HarnessMessage[]> => {
        const fresh = await grabBotMessages({
            session_id,
            after_id: seen_id,
            author: "user",
            limit: AppData.BotReplyHistoryMessages,
        });

        if (!fresh.length) return [];

        seen_id = Math.max(seen_id, ...fresh.map((message) => Number(message.id)));
        /**
         * A message read by the wrap up is not what the answer answers: the
         * answer was written for what came before it, and its own queued
         * reply is the one that reads this. Marking it answered here made
         * that reply finish silently, with nothing sent for it.
         */
        if (counted) answering_id = Math.max(answering_id, newestUserMessageId({ messages: fresh }));

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
                sql: `SELECT id FROM bot_sessions WHERE user_id = ? AND bot_id = ? AND workspace_id IS ? AND id != ? AND ask_id IS NULL LIMIT 1`,
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
     * The secrets the bot showed (`show_secret`), the graphics it made
     * or changed, and the next steps it suggested: their chips the reply
     * always carries, without needing the user.
     */
    const shown: string[] = [];
    /**
     * The plan it wrote in this reply: on its card and waiting for the user
     * to approve it, so the reply needs them.
     */
    const plan_refs: string[] = [];
    /**
     * Files the bot wrote and asked to send with its reply.
     */
    const attachments: number[] = [];
    /**
     * The tracker tasks the reply worked on, linked under it.
     */
    const task_ids: number[] = [];
    /**
     * The runs `send_reply` queued with this message: if the message never
     * goes out, they go with it, so nothing works on a message the user
     * never saw.
     */
    const queued_jobs: number[] = [];

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
     * A crew request's session and a hook's run are hidden: nobody follows
     * them.
     */
    const attended = !(await isHiddenSession({ session_id }));
    /**
     * The run's browser kind, also handed to `send_reply`'s work so a child run it
     * queues inherits it (H7): a hidden session's reply never lets its
     * children reach the user's real browsers either.
     */
    const browser_run_kind = attended ? "attended" : "unattended";
    /**
     * A crew request's answer: the brief sits in the user's own conversation
     * with the bot, so the run reads the request note and answers it, and the
     * asker is woken with the answer (`finishAsk`). The first answer job
     * carries `params.ask_id`; a follow-up reply in the same thread finds the
     * open request by its answer session, so it stays part of the request too.
     */
    const job_ask_id = Number(parseJobJson({ text: job.params })?.ask_id) || 0;
    const open_ask =
        session_id && !job_ask_id
            ? await grabOpenAskBySession({ session_id, user_id }).catch(() => null)
            : null;
    const asked =
        Boolean(job_ask_id) ||
        Boolean(open_ask?.id) ||
        (session_id ? Boolean(await grabSessionAskId({ session_id }).catch(() => null)) : false);
    /**
     * The request this run answers, for `update_requester` (an interim word
     * back to the bot that asked while the work is still open).
     */
    const ask_id_for_updates = job_ask_id || (open_ask?.id ? Number(open_ask.id) : 0);
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
        run_kind: browser_run_kind,
        message_id: job.message_id || undefined,
        job_id: job.id,
        onQueue: ({ job_id }) => queued_jobs.push(job_id),
        onTakeOver: ({ ref }) => take_overs.push(ref),
        onPropose: ({ ref }) => proposals.push(ref),
        onWorkspaceAdmin: (admin) => {
            led = admin;
        },
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
    /**
     * A worker passes on a task of its own (`hand_over_task`): the reply says
     * where it went and that it needs the run id, so no one claims a hand-over
     * that didn't happen.
     */
    const can_hand_over = tools.some((tool) => tool.name == "hand_over_task");
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

    /**
     * What the run may spend: a reply handed a tracker task says when it
     * used them all (`exhausted`).
     */
    const reply_max_steps = await grabReplyMaxToolSteps();

    try {
        const result = await runTextLoop({
            system: [
                prompt,
                carry_over,
                long_session_note,
                chatReplyNote({ bot_id: bot.id }),
                is_retry ? RerunReplyNote : "",
                botFilesNote({ bot_id: bot.id }),
                ComputerFilesNote({ computer_id: computers[0]?.id || 0, dirs, can_import: false }),
                TasksNote,
                TaskReminderNote,
                can_hand_over ? HandOverTaskNote : "",
                ActionCheckNote,
                RequestScopeNote({ can_ask: Boolean(attended) && !asked }),
                attended && !asked ? PlansNote : "",
                attended && !asked && plan?.status == "planned" ? PlanWaitingNote({ plan }) : "",
                attended && !asked && plan?.status == "paused" ? PlanPausedNote({ plan }) : "",
                attended && !asked && plan?.status == "active"
                    ? on_plan_step
                        ? PlanStepNote({ plan })
                        : PlanActiveNote({ plan })
                    : "",
                attended ? QuestionsNote : "",
                SecretsNote,
                SettingsNote,
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
                powers.is_coordinator || !attended ? "" : AskRulesNote,
                asked ? passedOnRequestNote : "",
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
                ...(ask_id_for_updates
                    ? [
                          updateRequesterTool({
                              user_id,
                              session_id: Number(session_id),
                              ask_id: ask_id_for_updates,
                          }),
                      ]
                    : []),
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
                    /**
                     * A card is answered in a conversation the user follows:
                     * in a hidden session (a crew request, a hook call, a
                     * room) nobody sees it, so the bot is told to ask in the
                     * chat instead of leaving a request hanging.
                     */
                    onRequest: attended ? ({ ref }) => proposals.push(ref) : undefined,
                    onShow: ({ ref }) => shown.push(ref),
                }),
                /**
                 * Only where the user follows the conversation: a hidden
                 * session has no card they could answer, and a
                 * question there was once shown to the coordinator as a bare
                 * ref, its answer never reaching the bot.
                 */
                ...(attended
                    ? [
                          askUserTool({
                              user_id,
                              bot_id: bot.id,
                              session_id,
                              workspace_id,
                              onAsk: ({ ref }) => proposals.push(ref),
                          }),
                          suggestNextStepsTool({
                              user_id,
                              bot_id: bot.id,
                              session_id,
                              workspace_id,
                              onSuggest: ({ ref }) => shown.push(ref),
                          }),
                      ]
                    : []),
                ...(attended && !asked
                    ? grabBotPlanTools({
                          user_id,
                          bot_id: bot.id,
                          session_id,
                          workspace_id,
                          on_step: on_plan_step,
                          /**
                           * A plan nobody approved yet needs the user, so
                           * it goes with the refs that set `needs_you`: the
                           * bot is waiting on them, not on itself.
                           */
                          onPlan: ({ ref, waiting }) => (waiting ? plan_refs.push(ref) : shown.push(ref)),
                      })
                    : []),
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
            max_steps: reply_max_steps,
            max_prompt_tokens: await grabRunMaxPromptTokens(),
            context_budget: await grabContextBudgetTokens(),
            bot_id: bot.id,
            workspace_id,
            signal,
            onStep: report,
            trace,
            incoming,
            /**
             * Files, tasks and work the answer names are checked against
             * the app's record before it goes out.
             */
            review: reviewRunAnswer({ bot_id: bot.id!, user_id, session_id, scopes, job_id: job.id }),
            /**
             * The message goes out only through `send_reply`: text a turn
             * writes without it is a draft, so no answer can promise work
             * the app never queued.
             */
            require_closing_answer: true,
        });

        /**
         * An answer the review kept faulting is never sent: the run stops
         * with why instead (`review_note`), and the job fails saying so. The
         * user gets an honest failure, not a claim the app knows is false.
         */
        if (result.review_note) {
            await dropUnsentQuestions({ refs: proposals });

            /**
             * A run `send_reply` queued announced work in a message that is
             * not going out: it is cancelled with it, so nothing carries on
             * behind a message the user never saw.
             */
            for (const queued of queued_jobs) {
                await cancelBotJob({ user_id, job_id: queued }).catch(() => null);
            }

            throw new BotJobFatalError(`The answer didn't hold up against the app's record, so it wasn't sent.`);
        }

        const answer = stripAppRecords({ text: result.text }).trim();

        /**
         * Nothing said is nothing to send: an empty message lands in the
         * thread as a bubble with no text, and the user has no idea what
         * happened. The job fails with why instead, which they do see.
         */
        if (!answer && !shown.length && !attachments.length) {
            await dropUnsentQuestions({ refs: proposals });

            for (const queued of queued_jobs) {
                await cancelBotJob({ user_id, job_id: queued }).catch(() => null);
            }

            throw new BotJobFatalError(`The run ended without an answer to send.`);
        }

        /**
         * Work queued in an earlier turn and then withdrawn by the message
         * that ended the run (`done` or `blocked`): the user reads that
         * nothing runs, so nothing may.
         */
        if (result.status !== "working") {
            for (const queued of queued_jobs) {
                await cancelBotJob({ user_id, job_id: queued }).catch(() => null);
            }
        }

        if (job.id && answering_id) {
            await markReplyAnswered({ job_id: job.id, message_id: answering_id });
        }

        return {
            ...withTakeOverRefs({
                text: answer,
                refs: [...take_overs, ...proposals, ...plan_refs],
                shown,
            }),
            attachments: attachments.length ? attachments : undefined,
            tool_log: result.tool_uses,
            task_ids,
            plan_id: on_plan_step ? plan?.id : undefined,
            /**
             * A reply handed a tracker task (`params.tracker_task_id`) that
             * used every step it had stopped short of finishing it: left
             * alone, the task looked like work still in hand.
             */
            exhausted: !isUnlimitedLimit(reply_max_steps) && result.steps > reply_max_steps,
        };
    } finally {
        await extensions.close();
        await browsers.close();
    }
}

/**
 * Cards whose message never went out are deleted: their answer only comes
 * from the card, so a pending row left behind waits forever and counts as a
 * question still asked.
 */
async function dropUnsentQuestions({ refs }: { refs: string[] }) {
    for (const ref of refs) {
        const question_id = Number(/\[question:(\d+)\]/.exec(ref)?.[1] || 0);

        if (!question_id) continue;

        await deleteBotQuestion({ question_id }).catch(() => null);
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
