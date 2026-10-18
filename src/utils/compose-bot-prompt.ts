type WorkspacePrompt = {
    name?: string | null;
    system_prompt?: string | null;
};

type Params = {
    system_prompt?: string | null;
    memory?: string | null;
    workspaces?: WorkspacePrompt[];
};

/**
 * The full prompt a bot runs with (markdown): its own core instructions,
 * then the shared context of each workspace it's in, then its memory.
 * Empty parts are left out.
 */
export default function composeBotPrompt({
    system_prompt,
    memory,
    workspaces = [],
}: Params) {
    const parts: string[] = [];

    if (system_prompt?.trim()) {
        parts.push(system_prompt.trim());
    }

    for (const workspace of workspaces) {
        if (!workspace.system_prompt?.trim()) continue;

        parts.push(
            `# Workspace: ${workspace.name?.trim() || "Untitled"}\n\n${workspace.system_prompt.trim()}`,
        );
    }

    if (memory?.trim()) {
        parts.push(`# Memory\n\n${memory.trim()}`);
    }

    return parts.join("\n\n");
}
