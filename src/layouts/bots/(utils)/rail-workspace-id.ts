type Params = {
    workspace: { id?: number | string | null } | null | undefined;
    pathname: string | null | undefined;
};

/**
 * The workspace the rail lists a crew for, or null for the bots' own
 * chats. `pageProps.workspace` alone can be set on a page outside
 * `/admin/workspaces/` (Settings keeps the last conversation's), and only
 * a workspace's own pages list its crew.
 */
export default function railWorkspaceId({ workspace, pathname }: Params) {
    const id = Number(workspace?.id) || 0;

    if (!id || !pathname?.startsWith("/admin/workspaces/")) return null;

    return id;
}