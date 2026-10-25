type Params = {
    all_bots: boolean;
    bot_ids: number[];
    workspace_ids: number[];
};

/**
 * Who gets an extension, as refs the chat renders as chips.
 */
export default function describeExtensionAccess({ all_bots, bot_ids, workspace_ids }: Params) {
    const bots = bot_ids.map((id) => `[bot:${id}]`).join(", ") || "none";
    const workspaces = workspace_ids.map((id) => `[workspace:${id}]`).join(", ") || "none";

    return `${all_bots ? "every new bot gets it; " : ""}bots: ${bots}; workspaces: ${workspaces}`;
}
