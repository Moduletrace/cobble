type Params = {
    /**
     * A path inside a computer's workspace, relative to its root (the files
     * browser's), e.g. `bots/3/users/1/reports`. Empty for the root.
     */
    path: string;
    /**
     * Super admins and admins (`canManageCrew`) see the whole workspace.
     */
    manages_crew: boolean;
    user_id: number | string;
    /**
     * The bots and workspaces the user reaches (`grabUserBot`,
     * `grabUserWorkspace`).
     */
    bot_ids: (number | string)[];
    workspace_ids: (number | string)[];
};

/**
 * Whether the files browser shows a path in a computer's workspace to a
 * user. Crew managers see all of it. Anyone else sees a bot's folder only
 * when they reach the bot, and within it only their own user folder
 * (`bots/<bot>/users/<them>`), a workspace's shared folder only when they
 * reach the workspace, and nothing else at the root.
 */
export default function computerPathAllowed({
    path,
    manages_crew,
    user_id,
    bot_ids,
    workspace_ids,
}: Params) {
    if (manages_crew) return true;

    const segments = path.split("/").filter(Boolean);
    const [top, owner, sub, sub_owner] = segments;

    if (!top) return true;

    if (top == "bots") {
        if (!owner) return true;

        if (!bot_ids.some((id) => String(Number(id)) == owner)) return false;

        if (sub == "users" && sub_owner) return sub_owner == String(Number(user_id));

        return true;
    }

    if (top == "workspaces") {
        if (!owner) return true;

        return workspace_ids.some((id) => String(Number(id)) == owner);
    }

    return false;
}
