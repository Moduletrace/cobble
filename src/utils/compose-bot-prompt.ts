type WorkspacePrompt = {
    name?: string | null;
    description?: string | null;
    system_prompt?: string | null;
};

type WorkspaceBotPrompt = {
    system_prompt?: string | null;
    memory?: string | null;
};

type Params = {
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
 * The full prompt a bot runs with (markdown): its own core instructions,
 * then the install-wide appendix, then, in a workspace, the workspace's
 * context and the bot's instructions there, then its core memory, its
 * memory about the user and its memory in the workspace (said to be the
 * bot's own notes, not the workspace's context). Empty parts are left out;
 * the workspace heading always shows, so the bot knows where it is.
 */
export default function composeBotPrompt({
    system_prompt,
    appendix,
    memory,
    user_memory,
    workspace,
    workspace_bot,
}: Params) {
    const parts: string[] = [];
    const name = workspace?.name?.trim() || "Untitled";

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
