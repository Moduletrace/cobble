import { TaskRunNote } from "@/src/data/harness-prompts";
import grabBotPrompt from "@/src/functions/backend/db/bots/grab-bot-prompt";
import runTextLoop from "@/src/harness/text/run-text-loop";
import openComputerTools from "@/src/harness/tools/computer/open-computer-tools";
import grabBotTools from "@/src/harness/tools/bot/grab-bot-tools";
import composeJobBrief from "./compose-job-brief";
import type { BotJobContext, BotJobOutcome } from "./types";

type Params = BotJobContext & {
    bot: { id: number; user_id: number };
};

/**
 * Works through a task: the bot follows its brief with its full prompt,
 * its own tools and, when the job has a computer, that computer's tools
 * (over MCP), until it answers. That answer is the report for the user.
 * Progress is saved after every model turn.
 */
export default async function runBotTask({
    bot,
    job,
    params,
    signal,
    update,
}: Params): Promise<BotJobOutcome> {
    const computer = job.computer_id
        ? await openComputerTools({ computer_id: job.computer_id, bot_id: bot.id, signal })
        : null;

    try {
        const prompt = await grabBotPrompt({ bot_id: bot.id, user_id: bot.user_id });

        const result = await runTextLoop({
            system: [
                prompt,
                TaskRunNote,
                computer
                    ? `You're working on the computer "${computer.name}" (a Linux sandbox with a shell, files, code runners and a browser). Use its tools; don't ask the user to run anything.`
                    : `You have no computer for this task.`,
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
                ...grabBotTools({ user_id: bot.user_id, bot_id: bot.id }),
                ...(computer?.tools || []),
            ],
            bot_id: bot.id,
            signal,
            onStep: async ({ text, tool_calls }) => {
                await update({
                    progress: tool_calls.length
                        ? `Using ${tool_calls.map((call) => call.name).join(", ")}`
                        : text?.slice(0, 500) || undefined,
                });
            },
        });

        return { result: computer ? computer.redact(result.text) : result.text };
    } finally {
        await computer?.close();
    }
}
