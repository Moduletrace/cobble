type WorkspacePrompt = {
    name?: string | null;
    description?: string | null;
    system_prompt?: string | null;
};

type WorkspaceBotPrompt = {
    system_prompt?: string | null;
    memory?: string | null;
};

type BotPrompt = {
    /**
     * The bot's id: how it names itself, and how the user, the crew tools
     * and every ref in a message point at it.
     */
    id?: number | string | null;
    name?: string | null;
    kind?: string | null;
    /**
     * The one-line role it does that job as, when it has one.
     */
    role?: string | null;
};

type Params = {
    /**
     * The bot itself. Its id is always in the prompt: it is how the bot
     * names itself and how everything else (crew tools, refs, tasks,
     * files) points back at it, in chat replies, tasks and routines alike.
     */
    bot?: BotPrompt | null;
    system_prompt?: string | null;
    /**
     * The install-wide text every bot gets, right after its own core
     * instructions (Settings > General).
     */
    appendix?: string | null;
    memory?: string | null;
    /**
     * What the bot remembers about the user it's working with.
     */
    user_memory?: string | null;
    /**
     * The workspace the bot is working in, if any.
     */
    workspace?: WorkspacePrompt | null;
    /**
     * The bot's own instructions and memory for that workspace.
     */
    workspace_bot?: WorkspaceBotPrompt | null;
};

/**
 * The full prompt a bot runs with (markdown): who it is (its name and id,
 * so it always knows which bot it is), its own core instructions, then the
 * install-wide appendix, then, in a workspace, the workspace's
 * context and the bot's instructions there, then its core memory, its
 * memory about the user and its memory in the workspace (said to be the
 * bot's own notes, not the workspace's context). Empty parts are left out;
 * the workspace heading always shows, so the bot knows where it is.
 */
export default function composeBotPrompt({
    bot,
    system_prompt,
    appendix,
    memory,
    user_memory,
    workspace,
    workspace_bot,
}: Params) {
    const parts: string[] = [];
    const name = workspace?.name?.trim() || "Untitled";
    const identity = composeIdentity({ bot });

    if (identity) {
        parts.push(identity);
    }

    if (system_prompt?.trim()) {
        parts.push(system_prompt.trim());
    }

    if (appendix?.trim()) {
        parts.push(`# Install-wide instructions\n\n${appendix.trim()}`);
    }

    if (workspace) {
        const context = [workspace.description?.trim(), workspace.system_prompt?.trim()].filter(
            Boolean,
        ) as string[];

        parts.push(
            [
                `# Workspace: ${name}`,
                `You're working in the workspace "${name}". Follow its context and your instructions for it below, over your general habits where they differ.`,
                context.length ? "The workspace's context, which the user sets:" : "",
                ...context,
            ]
                .filter(Boolean)
                .join("\n\n"),
        );

        if (workspace_bot?.system_prompt?.trim()) {
            parts.push(`# Your instructions in ${name}\n\n${workspace_bot.system_prompt.trim()}`);
        }
    }

    if (memory?.trim()) {
        parts.push(`# Memory\n\n${memory.trim()}`);
    }

    if (user_memory?.trim()) {
        parts.push(`# Memory about the user\n\n${user_memory.trim()}`);
    }

    if (workspace && workspace_bot?.memory?.trim()) {
        parts.push(
            `# Memory in ${name}\n\nYour own notes for this workspace: what you have learned here. They are not the workspace's description or context, which the user sets above; never call them the workspace's record. The user reads them in the workspace's settings, under this bot's row.\n\n${workspace_bot.memory.trim()}`,
        );
    }

    return parts.join("\n\n");
}

/**
 * Who the bot is, said once at the top of its prompt: its name, kind and
 * id, and that the id is how it is named. Empty when the caller didn't say
 * which bot it is.
 */
function composeIdentity({ bot }: { bot?: BotPrompt | null }) {
    const id = bot?.id === null || bot?.id === undefined ? "" : String(bot.id).trim();

    if (!id) return "";

    const name = bot?.name?.trim() || "A bot";
    const kind = bot?.kind == "coordinator" ? "the coordinator" : "a worker bot";
    const role = bot?.role?.trim();

    return [
        `# You are ${name}`,
        `You are ${kind} on this crew.${role ? ` Your role: ${role}.` : ""}`,
        `Your bot id is ${id}. That id is you: when a tool takes a bot id for the bot it is about (your own tasks, your own picture), this is it, and when you name yourself in a message write the ref \`[bot:${id}]\`, never another bot's.`,
    ].join("\n\n");
}
