import grabCrewRequests from "@/src/functions/backend/db/chatrooms/grab-crew-requests";
import grabBotRunPowers from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";
import { grabSkillBodyShownChars } from "@/src/functions/backend/db/app-settings/grab-skill-limits";
import grabWorkspaceAdminTools from "@/src/harness/tools/bot/grab-workspace-admin-tools";
import workspaceAdminsNote from "./workspace-admins-note";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import {
    ActionCheckNote,
    RequestScopeNote,
    QuestionsNote,
    SecretsNote,
    SettingsNote,
    GraphicsNote,
    botFilesNote,
    ComputerFilesNote,
    ScheduledRunNote,
    HookRunNote,
    InstallRequestNote,
    TasksNote,
    TaskRunNote,
    AskCrewNote,
    crewRequestsNote,
    WorkspaceLearningNote,
    TaskIncomingNote,
    TaskRedraftNote,
    TaskWrapUpIncomingNote,
    taskPlanNote,
} from "@/src/data/harness-prompts";
import {
    grabContextBudgetTokens,
    grabHarnessMaxToolSteps,
    grabRunMaxPromptTokens,
    grabUnattendedMaxToolSteps,
} from "@/src/functions/backend/db/app-settings/grab-run-limits";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import runTextLoop from "@/src/harness/text/run-text-loop";
import { isUnlimitedLimit, smallerRunLimit } from "@/src/utils/run-limit";
import openComputerTools from "@/src/harness/tools/computer/open-computer-tools";
import openBotBrowsers, { type OpenBotBrowsers } from "@/src/harness/tools/browsers/open-bot-browsers";
import openBotExtensions, { type OpenBotExtensions } from "@/src/harness/tools/extensions/open-bot-extensions";
import openBotSkills, { type OpenBotSkills } from "@/src/harness/tools/skills/open-bot-skills";
import openBotKnowledgebases from "@/src/harness/tools/knowledgebases/open-bot-knowledgebases";
import grabBotTools from "@/src/harness/tools/bot/grab-bot-tools";
import grabBotSecretTools from "@/src/harness/tools/bot/secrets/grab-bot-secret-tools";
import askUserTool from "@/src/harness/tools/bot/questions/ask-user-tool";
import suggestNextStepsTool from "@/src/harness/tools/bot/suggestions/suggest-next-steps-tool";
import createWorkspaceTool from "@/src/harness/tools/bot/create-workspace-tool";
import updateWorkspaceTool from "@/src/harness/tools/bot/update-workspace-tool";
import listWorkspacePeopleTool from "@/src/harness/tools/bot/list-workspace-people-tool";
import setUserWorkspaceRoleTool from "@/src/harness/tools/bot/set-user-workspace-role-tool";
import askToTakeOverTool from "@/src/harness/tools/computer/ask-to-take-over-tool";
import importFileTool from "@/src/harness/tools/computer/import-file-tool";
import searchComputersTool from "@/src/harness/tools/computer/search-computers-tool";
import grabBotFileTools from "@/src/harness/tools/storage/grab-bot-file-tools";
import grabBotGraphicTools from "@/src/harness/tools/graphics/grab-bot-graphic-tools";
import reportRunFailedTool from "@/src/harness/tools/bot/report-run-failed-tool";
import answerInstallRequestTool from "@/src/harness/tools/bot/answer-install-request-tool";
import requestInstallTool from "@/src/harness/tools/computer/request-install-tool";
import composeBrowsersNote from "./compose-browsers-note";
import computerRef from "@/src/utils/computer-ref";
import grabRunScopes from "@/src/functions/backend/db/bot-files/grab-run-scopes";
import composeJobBrief from "./compose-job-brief";
import grabSessionCarryOver from "./grab-session-carry-over";
import jobSessionId from "@/src/functions/backend/db/bots-queue/job-session-id";
import withTakeOverRefs from "./with-take-over-refs";
import stripAppRecords from "@/src/utils/strip-app-records";
import ScheduledRunFailedError from "./scheduled-run-failed-error";
import type { BotJobContext, BotJobOutcome } from "./types";
import computerRunDirs from "@/src/utils/computer-work-dirs";
import taskIncoming from "./task-incoming";
import planBotTask from "./plan-bot-task";
import shouldPlanBotTask from "./should-plan-bot-task";
import pushUserTurn from "@/src/harness/text/push-user-turn";
import type { HarnessMessage } from "@/src/harness/types";

type Params = BotJobContext & {
    bot: Pick<BUN_SQLITE_COBBLE_BOTS, "kind"> & { id: number };
    /**
     * The user whose conversation the job is in.
     */
    user_id: number;
};

/**
 * Works through a task in its session's workspace (if any): the bot
 * follows its brief with its full prompt,
 * its own tools, search_computers across all its computers, its MCP
 * servers' and custom tools (`openBotExtensions`) and, when the job has a
 * computer, that computer's tools (over MCP), until it answers. That answer is the report for the user.
 * When only the user can go on (a login, a captcha), the bot asks them to
 * take over (`ask_user_to_take_over`) and the report needs them.
 * A scheduled run acts on its own (`ScheduledRunNote`), as does a hook
 * call (`HookRunNote`, its payload only data); one that reports it failed
 * (`report_run_failed`) throws, so the queue retries it.
 * A task the user follows takes in what they write in its conversation
 * from when it was queued (`taskIncoming`): already there at the start,
 * between steps, past a report not yet out, and by the wrap up. A
 * correction changes the work; anything else is left to the chat.
 * Every model turn is reported as a step (`report`).
 */
export default async function runBotTask({
    bot,
    user_id,
    job,
    params,
    computer_shared,
    signal,
    report,
}: Params): Promise<BotJobOutcome> {
    const workspace_id = job.workspace_id || null;
    /**
     * Where the run works on a computer: the user's folder in the bot's.
     */
    const dirs = computerRunDirs({ bot_id: bot.id, bot_kind: bot.kind, user_id, workspace_id });

    /**
     * The secrets the bot captured or showed and the graphics it made or
     * changed, whose chips the report always carries.
     */
    const shown: string[] = [];
    /**
     * The tracker tasks the run worked on, linked under its report.
     */
    const task_ids: number[] = [];

    const computer = job.computer_id
        ? await openComputerTools({
              computer_id: job.computer_id,
              browser: !computer_shared,
              bot_id: bot.id,
              user_id,
              workspace_id,
              dirs,
              onSecretRef: ({ ref }) => shown.push(ref),
              signal,
          })
        : null;

    let extensions: OpenBotExtensions | undefined;
    let browsers: OpenBotBrowsers | undefined;
    let skills: OpenBotSkills | undefined;

    try {
        const session_id = await jobSessionId({ job });
        const prompt = await grabBotPrompt({ bot_id: bot.id, user_id, workspace_id });
        const computers = await grabBotComputers({ bot_id: bot.id, workspace_id });

        /**
         * What the bot's types let it do here. A coordinator's task can
         * also change workspaces, and a workspace admin's its workspace:
         * the findings it was asked to record go there, not only in the
         * report.
         */
        const powers = await grabBotRunPowers({ bot_id: bot.id, workspace_id });
        const coordinator_workspaces = powers.is_coordinator
            ? (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived)
            : [];
        const carry_over = await grabSessionCarryOver({
            session_id,
            bot_id: bot.id,
            workspace_id,
            signal,
        }).catch(() => "");
        const take_overs: string[] = [];
        /**
         * The next steps the bot suggested: added to the message without
         * needing the user.
         */
        const suggestions: string[] = [];
        /**
         * Files the bot wrote and asked to send with its report.
         */
        const attachments: number[] = [];
        const scheduled = Boolean(params.schedule_id);
        /**
         * Started by a call to one of the user's hooks: acts on its own
         * like a routine, and treats the call's payload as data.
         */
        const hooked = Boolean(params.hook_id);
        /**
         * Only a task the user follows in their conversation asks them
         * questions: routines and hook calls act on their own, and a
         * chatroom's session is hidden from them.
         */
        const can_ask = Boolean(session_id) && !scheduled && !hooked && !params.chatroom_id;
        /**
         * The coordinator weighing a worker's install request
         * (`request_install`): it answers it with answer_install_request.
         */
        const install_request_id = powers.is_coordinator ? Number(params.install_request_id) || 0 : 0;
        let failure = null as string | null;

        /**
         * A take-over defaults to the computer the task runs on.
         */
        const take_over_computers = [
            ...computers.filter((c) => c.id == job.computer_id),
            ...computers.filter((c) => c.id != job.computer_id),
        ];
        /**
         * The files this run reaches, for its file tools, an import and the
         * pictures it may set: one answer, where `grabRunScopes` decides.
         */
        const scopes = await grabRunScopes({ bot, user_id, workspace_id });

        /**
         * A workspace admin's task keeps the workspace's context and its
         * members' instructions; it hands nothing over (no session to report
         * back to mid-task).
         */
        const admin_tools =
            !powers.is_coordinator && workspace_id && powers.is_workspace_admin
                ? (await grabWorkspaceAdminTools({
                      bot,
                      user_id,
                      workspace_id,
                      powers,
                      scopes,
                      onTask: ({ task_id }) => task_ids.push(task_id),
                  })).tools
                : [];

        const tools = [
            ...(await grabBotTools({
                user_id,
                bot_id: bot.id,
                workspace_id,
                computers,
                session_id,
                is_coordinator: powers.is_coordinator,
                admin_workspace_ids: powers.admin_workspace_ids,
                scopes,
                hooked,
                onTask: ({ task_id }) => task_ids.push(task_id),
            })),
            ...admin_tools,
            ...(powers.is_coordinator
                ? [
                      createWorkspaceTool({ user_id, workspaces: coordinator_workspaces }),
                      ...(coordinator_workspaces.length
                          ? [
                                updateWorkspaceTool({
                                    user_id,
                                    workspaces: coordinator_workspaces,
                                    workspace_id,
                                    scopes,
                                }),
                                listWorkspacePeopleTool({ workspaces: coordinator_workspaces, workspace_id }),
                                setUserWorkspaceRoleTool({
                                    user_id,
                                    workspaces: coordinator_workspaces,
                                    workspace_id,
                                }),
                            ]
                          : []),
                  ]
                : []),
            ...(computers.length
                ? [
                      searchComputersTool({ bot_id: bot.id, user_id, computers, workspace_id, dirs }),
                      ...(hooked
                          ? []
                          : [
                                askToTakeOverTool({
                                    computers: take_over_computers,
                                    in_task: true,
                                    onAsk: ({ ref }) => take_overs.push(ref),
                                }),
                            ]),
                  ]
                : []),
            ...grabBotSecretTools({
                user_id,
                bot_id: bot.id,
                session_id,
                workspace_id,
                computer_id: job.computer_id || null,
                in_task: true,
                onRequest: hooked ? undefined : ({ ref }) => take_overs.push(ref),
                onShow: ({ ref }) => shown.push(ref),
            }),
            ...(can_ask
                ? [
                      askUserTool({
                          user_id,
                          bot_id: bot.id,
                          session_id,
                          workspace_id,
                          in_task: true,
                          onAsk: ({ ref }) => take_overs.push(ref),
                      }),
                      suggestNextStepsTool({
                          user_id,
                          bot_id: bot.id,
                          session_id,
                          workspace_id,
                          onSuggest: ({ ref }) => suggestions.push(ref),
                      }),
                  ]
                : []),
            ...(scheduled || hooked ? [reportRunFailedTool({ onFail: ({ reason }) => (failure = reason) })] : []),
            /**
             * A worker has no sudo on its computer: it asks the
             * coordinator to install, from a task the user follows (the
             * answer wakes it there).
             */
            ...(computer && dirs.run_as && can_ask && job.computer_id && !powers.is_coordinator
                ? [
                      requestInstallTool({
                          user_id,
                          bot_id: bot.id,
                          session_id,
                          workspace_id,
                          computer_id: job.computer_id,
                      }),
                  ]
                : []),
            ...(install_request_id && job.id ? [answerInstallRequestTool({ request_id: install_request_id, job_id: job.id })] : []),
            ...(computer?.tools || []),
            ...(job.computer_id
                ? [
                      importFileTool({
                          computer_id: job.computer_id,
                          scopes,
                          bot_id: bot.id,
                          user_id,
                          dirs,
                      }),
                  ]
                : []),
            ...(await grabBotFileTools({
                bot,
                user_id,
                workspace_id,
                session_id,
                scopes,
                onAttach: ({ media_id }) => attachments.push(media_id),
            })),
            ...grabBotGraphicTools({
                bot_id: bot.id,
                user_id,
                session_id,
                workspace_id,
                job_id: job.id || null,
                onGraphic: ({ ref }) => shown.push(ref),
            }),
        ];

        extensions = await openBotExtensions({
            bot_id: bot.id,
            user_id,
            workspace_id,
            computer_id: job.computer_id || null,
            dirs,
            taken: tools.map((tool) => tool.name),
            signal,
        });

        const browser_run_kind = hooked || params.chatroom_id ? "unattended" : scheduled ? "routine" : "attended";

        browsers = await openBotBrowsers({
            user_id,
            bot_id: bot.id,
            workspace_id,
            run_kind: browser_run_kind,
            taken: [...tools, ...extensions.tools].map((tool) => tool.name),
            signal,
        });

        skills = openBotSkills({
            skills: extensions.skills,
            shown_chars: await grabSkillBodyShownChars(),
            taken: [...tools, ...extensions.tools, ...browsers.tools].map((tool) => tool.name),
        });

        const knowledge = openBotKnowledgebases({
            knowledgebases: extensions.knowledgebases,
            taken: [...tools, ...extensions.tools, ...browsers.tools, ...skills.tools].map((tool) => tool.name),
        });

        /**
         * The install's limit, or less when the brief's writer set a
         * budget (`start_task` `max_steps`). A routine run or a hook call,
         * which nobody watches, gets the smaller unattended limit (never
         * more than a task's).
         */
        const task_steps = await grabHarnessMaxToolSteps();
        const install_steps =
            scheduled || hooked
                ? smallerRunLimit({ a: task_steps, b: await grabUnattendedMaxToolSteps() })
                : task_steps;
        const budget = Math.floor(Number(params.max_steps) || 0);
        const max_steps = budget > 0 ? smallerRunLimit({ a: budget, b: install_steps }) : install_steps;
        /**
         * What the run is told it has. Unlimited is said as such rather
         * than as a number: the job's deadline still ends it, and a run
         * told "at most 0 steps" would stop before it began.
         */
        const steps_note = isUnlimitedLimit(max_steps)
            ? `This run has no step limit: work until the job is done. Its job still stops it after a while, so save what you find as you go, and if you're no closer after a few tries, stop and report what you tried and what you need from the user rather than spending the rest.`
            : `This run has at most ${max_steps} steps (model turns)${budget > 0 ? ", set when it was queued" : ""}. Plan for that: pace yourself, save what you find as you go, and if you're no closer after a few tries, stop and report what you tried and what you need from the user rather than spending the rest.`;

        /**
         * What the user wrote since the run was queued, for a run they
         * follow: what's there now goes after the brief.
         */
        const incoming =
            can_ask && session_id
                ? await taskIncoming({ session_id, queued_at: Number(job.created_at) || Date.now(), user_id })
                : null;
        const arrived = (await incoming?.take()) || [];
        const brief: HarnessMessage = {
            role: "user",
            content: composeJobBrief({
                title: job.title,
                instructions: job.instructions,
                params,
            }),
        };
        const opening: HarnessMessage[] = [brief];

        if (arrived.length) {
            pushUserTurn({ transcript: opening, content: TaskIncomingNote });

            for (const turn of arrived) {
                if (turn.role == "user") pushUserTurn({ transcript: opening, content: turn.content });
            }
        }

        const system = [
            prompt,
            carry_over,
            TaskRunNote,
            steps_note,
            scheduled ? ScheduledRunNote : "",
            hooked ? HookRunNote : "",
            install_request_id ? InstallRequestNote : "",
            botFilesNote({ bot_id: bot.id }),
            ComputerFilesNote({ computer_id: job.computer_id || 0, dirs }),
            TasksNote,
            ActionCheckNote,
            RequestScopeNote({ can_ask }),
            can_ask ? QuestionsNote : "",
            SecretsNote,
            SettingsNote,
            GraphicsNote,
            workspace_id ? WorkspaceLearningNote : "",
            powers.is_coordinator
                ? `If this brief asked you to record something in a workspace (its context, or a new one), do it yourself with update_workspace or create_workspace before you report: the report alone changes nothing.`
                : admin_tools.some((tool) => tool.name == "update_workspace")
                  ? `If this brief asked you to record something in this workspace's context, do it yourself with update_workspace before you report: the report alone changes nothing.`
                  : "",
            powers.is_coordinator || powers.is_workspace_admin
                ? ""
                : await workspaceAdminsNote({ bot_id: bot.id, workspace_id }),
            powers.is_coordinator || hooked ? "" : AskCrewNote,
            powers.is_coordinator || hooked || params.chatroom_id
                ? ""
                : crewRequestsNote({ requests: await grabCrewRequests({ user_id, bot_id: bot.id, workspace_id }) }),
            computer && computer_shared
                ? `You're working on the computer "${computer.name}" (a Linux sandbox with a shell, files and code runners) while another run uses it, so you have its shell and files but not its browser. If the answer needs the browser, say so in your report instead of waiting.`
                : computer
                ? `You're working on the computer "${computer.name}" (a Linux sandbox with a shell, files, code runners and a browser). Use its tools; don't ask the user to run anything.${hooked ? "" : " When only the user can go on (a login, a captcha, a code sent to them), ask them to take over with ask_user_to_take_over."}`
                : workspace_id
                  ? `You have no computer for this task: this workspace has none. If the task needs one, stop and say so in the report; the user can add a computer to the workspace.`
                  : `You have no computer for this task.`,
            computers.length > 1
                ? `search_computers runs a read-only command on every computer you have. When you name one in the report, write its ref, e.g. ${computerRef({ id: computers[0]!.id || 0 })}: the user can click it to switch you to that computer.`
                : "",
            computer?.envs.length
                ? `Environment variables set on this computer (use them by name, e.g. $KEY; never print their values):\n${computer.envs
                      .map((env) => `- ${env.key}${env.description ? `: ${env.description}` : ""}`)
                      .join("\n")}`
                : "",
            composeBrowsersNote({
                browsers: browsers.browsers,
                has_computer_browser: Boolean(computer),
                run_kind: browser_run_kind,
            }),
            skills.note,
            knowledge.note,
            extensions.note,
        ]
            .filter(Boolean)
            .join("\n\n");

        /*
         * The plan this run works from, written in one turn before it takes
         * a step (`planBotTask`). It shares this run's prompt, so it costs
         * little more than the plan, and it saves the steps a long run
         * spends finding out what it is doing. A run whose plan can't be
         * written starts the way it always did.
         */
        const planned = shouldPlanBotTask({ max_steps, in_chatroom: Boolean(params.chatroom_id) })
            ? await planBotTask({ system, messages: opening, signal, bot_id: bot.id, workspace_id }).catch(
                  (error) => {
                      if (signal.aborted) throw error;

                      return null;
                  },
              )
            : null;

        if (planned) {
            pushUserTurn({ transcript: opening, content: taskPlanNote({ plan: planned.plan }) });
            await report({
                index: -1,
                text: `Plan: ${planned.plan.goal}`,
                tool_calls: [],
                candidate: planned.candidate,
            });
        }

        const result = await runTextLoop({
            system,
            messages: opening,
            tools: [...tools, ...extensions.tools, ...browsers.tools, ...skills.tools, ...knowledge.tools],
            max_steps,
            max_prompt_tokens: await grabRunMaxPromptTokens(),
            context_budget: await grabContextBudgetTokens(),
            bot_id: bot.id,
            workspace_id,
            signal,
            onStep: (step) =>
                report({ ...step, text: step.text && computer ? computer.redact(step.text) : step.text }),
            ...(incoming
                ? {
                      incoming: incoming.take,
                      incoming_notes: {
                          working: TaskIncomingNote,
                          redraft: TaskRedraftNote,
                          wrap_up: TaskWrapUpIncomingNote,
                      },
                  }
                : {}),
        });

        if (failure) {
            throw new ScheduledRunFailedError(computer ? computer.redact(failure) : failure);
        }

        const text = stripAppRecords({ text: result.text });

        return {
            ...withTakeOverRefs({
                text: computer ? computer.redact(text) : text,
                refs: take_overs,
                shown: [...shown, ...suggestions],
            }),
            attachments: attachments.length ? attachments : undefined,
            tool_log: result.tool_uses,
            task_ids,
            /**
             * The wrap up was announced (`steps` counts its turns), so the
             * run never got to the end of the work it was given.
             */
            exhausted: !isUnlimitedLimit(max_steps) && result.steps > max_steps,
        };
    } finally {
        await extensions?.close();
        await browsers?.close();
        await computer?.close();
    }
}
