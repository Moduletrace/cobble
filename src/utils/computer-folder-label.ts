type Params = {
    /**
     * A path inside a computer's workspace, e.g. `bots/3/users/7`.
     */
    path: string;
    names: {
        bots: Record<string, string>;
        users: Record<string, string>;
        workspaces: Record<string, string>;
    };
};

/**
 * What an id folder in a computer's workspace is, for the files browser:
 * `bots/3` is the bot's name, `bots/3/users/7` the user's, `workspaces/2`
 * the workspace's. Empty for anything else.
 */
export default function computerFolderLabel({ path, names }: Params) {
    const [top, owner, sub, sub_owner, ...rest] = path.split("/").filter(Boolean);

    if (!owner || rest.length) return "";

    if (top == "workspaces" && !sub) return names.workspaces[owner] || "";

    if (top != "bots") return "";

    if (!sub) return names.bots[owner] || "";

    if (sub == "users" && sub_owner) return names.users[sub_owner] || "";

    return "";
}
