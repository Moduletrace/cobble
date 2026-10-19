import { TaskRunNote, WorkspaceLearningNote } from "@/src/data/harness-prompts";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import runTextLoop from "@/src/harness/text/run-text-loop";
import openComputerTools from "@/src/harness/tools/computer/open-computer-tools";
import grabBotTools from "@/src/harness/tools/bot/grab-bot-tools";
import askToTakeOverTool from "@/src/harness/tools/computer/ask-to-take-over-tool";
import searchComputersTool from "@/src/harness/tools/computer/search-computers-tool";
import computerRef from "@/src/utils/computer-ref";
import composeJobBrief from "./compose-job-brief";
import grabSessionCarryOver from "./grab-session-carry-over";
import jobSessionId from "@/src/functions/backend/db/bots-queue/job-session-id";
import withTakeOverRefs from "./with-take-over-refs";
import type { BotJobContext, BotJobOutcome } from "./types";

type Params = BotJobContext & {
    bot: { id: number };
    /**
     * The user whose conversation the job is in.
     */
    user_id: number;
};

/**
 * Works through a task in its session's workspace (if any): the bot
 * follows its brief with its full prompt,
 * its own tools, search_computers across all its computers and, when the
 * job has a computer, that computer's tools (over MCP), until it answers. That answer is the report for the user.
 * When only the user can go on (a login, a captcha), the bot asks them to
 * take over (`ask_user_to_take_over`) and the report needs them.
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

    try {
        const session_id = await jobSessionId({ job });
        const prompt = await grabBotPrompt({ bot_id: bot.id, user_id, workspace_id });
        const computers = await grabBotComputers({ bot_id: bot.id, workspace_id });
        const carry_over = await grabSessionCarryOver({
            session_id,
            bot_id: bot.id,
            workspace_id,
            signal,
        }).catch(() => "");
        const take_overs: string[] = [];

        /**
         * A take-over defaults to the computer the task runs on.
         */
        const take_over_computers = [
            ...computers.filter((c) => c.id == job.computer_id),
            ...computers.filter((c) => c.id != job.computer_id),
        ];

        const result = await runTextLoop({
            system: [
                prompt,
                carry_over,
                TaskRunNote,
                workspace_id ? WorkspaceLearningNote : "",
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
            tools: [
                ...grabBotTools({ user_id, bot_id: bot.id, workspace_id, computers }),
                ...(computers.length
                    ? [
                          searchComputersTool({ computers, workspace_id }),
                          askToTakeOverTool({
                              computers: take_over_computers,
                              in_task: true,
                              onAsk: ({ ref }) => take_overs.push(ref),
                          }),
                      ]
                    : []),
                ...(computer?.tools || []),
            ],
            bot_id: bot.id,
            workspace_id,
            signal,
            onStep: (step) =>
                report({ ...step, text: step.text && computer ? computer.redact(step.text) : step.text }),
        });

        return withTakeOverRefs({
            text: computer ? computer.redact(result.text) : result.text,
            refs: take_overs,
        });
    } finally {
        await computer?.close();
    }
}
