type Workspace = {
    id?: number | string | null;
    name?: string | null;
    description?: string | null;
    system_prompt?: string | null;
};

type Params = {
    workspaces: Workspace[];
    query?: string;
    limit?: number;
    /**
     * Return the one match's whole shared context: the text
     * `update_workspace` replaces, which a bot has to read before it writes.
     */
    include_context?: boolean;
    /**
     * Only this workspace: the run is in one, so it is the only one the run
     * can change and the only one worth reading.
     */
    only_workspace_id?: number | string | null;
};

const DefaultLimit = 20;

/**
 * What find_workspace answers with: each matching workspace on a line, and
 * with `include_context` on a single match, its context as stored, whole and
 * without a fence, so copying it back keeps it exactly.
 */
export default function findWorkspaceResult({
    workspaces,
    query,
    limit,
    include_context,
    only_workspace_id,
}: Params): string {
    const scoped = only_workspace_id
        ? workspaces.filter((workspace) => Number(workspace.id) == Number(only_workspace_id))
        : workspaces;

    const words = (query || "").trim().toLowerCase();

    const matches = (
        words
            ? scoped.filter((workspace) =>
                  [
                      workspace.id ? String(workspace.id) : "",
                      workspace.name,
                      workspace.description,
                      workspace.system_prompt,
                  ].some((field) => (field || "").toLowerCase().includes(words)),
              )
            : scoped
    ).slice(0, limit ?? DefaultLimit);

    if (!matches.length) {
        return only_workspace_id
            ? `No workspace has id ${only_workspace_id}.`
            : `No workspace matches "${query || ""}".`;
    }

    const lines = matches.map(
        (workspace) =>
            `#${workspace.id} ${workspace.name}${workspace.description ? ` - ${workspace.description}` : ""}`,
    );

    if (!include_context) return lines.join("\n");

    if (matches.length > 1) {
        return `${lines.join("\n")}\n\ninclude_context needs one workspace: pass workspace_id, or a query that matches one.`;
    }

    const context = (matches[0]?.system_prompt || "").trim();

    return context
        ? `${lines.join("\n")}\n\nContext, ${context.length} characters:\n\n${context}`
        : `${lines.join("\n")}\n\nContext, empty.`;
}