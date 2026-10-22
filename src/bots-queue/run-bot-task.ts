import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import {
    ActionCheckNote,
    BotFilesNote,
    ComputerFilesNote,
    ScheduledRunNote,
    TasksNote,
    TaskRunNote,
    WorkspaceLearningNote,
} from "@/src/data/harness-prompts";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import runTextLoop from "@/src/harness/text/run-text-loop";
import openComputerTools from "@/src/harness/tools/computer/open-computer-tools";
import openBotExtensions, { type OpenBotExtensions } from "@/src/harness/tools/extensions/open-bot-extensions";
import openBotSkills, { type OpenBotSkills } from "@/src/harness/tools/skills/open-bot-skills";
import grabBotTools from "@/src/harness/tools/bot/grab-bot-tools";
import createWorkspaceTool from "@/src/harness/tools/bot/create-workspace-tool";
import updateWorkspaceTool from "@/src/harness/tools/bot/update-workspace-tool";
import askToTakeOverTool from "@/src/harness/tools/computer/ask-to-take-over-tool";
import importFileTool from "@/src/harness/tools/computer/import-file-tool";
import searchComputersTool from "@/src/harness/tools/computer/search-computers-tool";
import grabBotFileTools from "@/src/harness/tools/storage/grab-bot-file-tools";
import reportRunFailedTool from "@/src/harness/tools/bot/report-run-failed-tool";
import computerRef from "@/src/utils/computer-ref";
import grabStorageScopes from "@/src/utils/storage-access";
import composeJobBrief from "./compose-job-brief";
import grabSessionCarryOver from "./grab-session-carry-over";
import jobSessionId from "@/src/functions/backend/db/bots-queue/job-session-id";
import withTakeOverRefs from "./with-take-over-refs";
import ScheduledRunFailedError from "./scheduled-run-failed-error";
import type { BotJobContext, BotJobOutcome } from "./types";

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
 * A scheduled run acts on its own (`ScheduledRunNote`); one that reports
 * it failed (`report_run_failed`) throws, so the queue retries it.
 * Every model turn is reported as a step (`report`).
 */
export default async function runBotTask({
    bot,
    user_id,
    job,
    params,
    signal,
    report,
}: Params): Promise<BotJobOutcome> {
    const workspace_id = job.workspace_id || null;

    const computer = job.computer_id
        ? await openComputerTools({
              computer_id: job.computer_id,
              bot_id: bot.id,
              workspace_id,
              signal,
          })
        : null;

    let extensions: OpenBotExtensions | undefined;
    let skills: OpenBotSkills | undefined;

    try {
        const session_id = await jobSessionId({ job });
        const prompt = await grabBotPrompt({ bot_id: bot.id, user_id, workspace_id });
        const computers = await grabBotComputers({ bot_id: bot.id, workspace_id });

        /**
         * A coordinator's task can also change workspaces: the findings
         * it was asked to record go there, not only in the report.
         */
        const coordinator_workspaces =
            bot.kind == "coordinator"
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
         * Files the bot wrote and asked to send with its report.
         */
        const attachments: number[] = [];
        const scheduled = Boolean(params.schedule_id);
        let failure = null as string | null;

        /**
         * A take-over defaults to the computer the task runs on.
         */
        const take_over_computers = [
            ...computers.filter((c) => c.id == job.computer_id),
            ...computers.filter((c) => c.id != job.computer_id),
        ];

        const tools = [
            ...(await grabBotTools({
                user_id,
                bot_id: bot.id,
                workspace_id,
                computers,
                session_id,
                is_coordinator: bot.kind == "coordinator",
            })),
            ...(bot.kind == "coordinator"
                ? [
                      createWorkspaceTool({ user_id, workspaces: coordinator_workspaces }),
                      ...(coordinator_workspaces.length
                          ? [
                                updateWorkspaceTool({
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
                      searchComputersTool({ bot_id: bot.id, computers, workspace_id }),
                      askToTakeOverTool({
                          computers: take_over_computers,
                          in_task: true,
                          onAsk: ({ ref }) => take_overs.push(ref),
                      }),
                  ]
                : []),
            ...(scheduled ? [reportRunFailedTool({ onFail: ({ reason }) => (failure = reason) })] : []),
            ...(computer?.tools || []),
            ...(job.computer_id
                ? [
                      importFileTool({
                          computer_id: job.computer_id,
                          scopes: grabStorageScopes({
                              bot_id: bot.id,
                              bot_kind: bot.kind,
                              workspace_id,
                          }),
                          bot_id: bot.id,
                          user_id,
                      }),
                  ]
                : []),
            ...(await grabBotFileTools({
                bot,
                user_id,
                workspace_id,
                session_id,
                onAttach: ({ media_id }) => attachments.push(media_id),
            })),
        ];

        extensions = await openBotExtensions({
            bot_id: bot.id,
            workspace_id,
            computer_id: job.computer_id || null,
            taken: tools.map((tool) => tool.name),
            signal,
        });

        skills = openBotSkills({
            skills: extensions.skills,
            taken: [...tools, ...extensions.tools].map((tool) => tool.name),
        });

        const result = await runTextLoop({
            system: [
                prompt,
                carry_over,
                TaskRunNote,
                scheduled ? ScheduledRunNote : "",
                BotFilesNote,
                ComputerFilesNote({ computer_id: job.computer_id || 0 }),
                TasksNote,
                ActionCheckNote,
                workspace_id ? WorkspaceLearningNote : "",
                bot.kind == "coordinator"
                    ? `If this brief asked you to record something in a workspace (its context, or a new one), do it yourself with update_workspace or create_workspace before you report: the report alone changes nothing.`
                    : "",
                computer
                    ? `You're working on the computer "${computer.name}" (a Linux sandbox with a shell, files, code runners and a browser). Use its tools; don't ask the user to run anything. When only the user can go on (a login, a captcha, a code sent to them), ask them to take over with ask_user_to_take_over.`
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
                skills.note,
                extensions.note,
            ]
                .filter(Boolean)
                .join("\n\n"),
            messages: [
                {
                    role: "user",
                    content: composeJobBrief({
                        title: job.title,
                        instructions: job.instructions,
                        params,
                    }),
                },
            ],
            tools: [...tools, ...extensions.tools, ...skills.tools],
            bot_id: bot.id,
            workspace_id,
            signal,
            onStep: (step) =>
                report({ ...step, text: step.text && computer ? computer.redact(step.text) : step.text }),
        });

        if (failure) {
            throw new ScheduledRunFailedError(computer ? computer.redact(failure) : failure);
        }

        return {
            ...withTakeOverRefs({
                text: computer ? computer.redact(result.text) : result.text,
                refs: take_overs,
            }),
            attachments: attachments.length ? attachments : undefined,
        };
    } finally {
        await extensions?.close();
        await computer?.close();
    }
}
