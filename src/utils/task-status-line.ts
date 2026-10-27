import { BotTaskStatusLine } from "@/src/dict/bot-queue-dict";

type Params = {
    /**
     * The workspace the task runs in, if any.
     */
    workspace_name?: string | null;
};

/**
 * The status line while a task runs, naming its workspace when it runs in
 * one, so the bot's own chat says where the work is. Never the task.
 */
export default function taskStatusLine({ workspace_name }: Params) {
    const name = workspace_name?.trim();

    return name ? `${BotTaskStatusLine} in ${name} workspace` : BotTaskStatusLine;
}
