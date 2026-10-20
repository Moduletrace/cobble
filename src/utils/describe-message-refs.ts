import messageRefIds from "./message-ref-ids";

/**
 * What a ref stands for: a bot's name and role, or a workspace's name.
 */
export type MessageRefNames = {
    bots: Map<number, { name: string; role?: string | null }>;
    workspaces: Map<number, { name: string }>;
};

/**
 * A line telling the bot who and what a user message mentions, e.g.
 * `[Mentions: [bot:3] is Ada (Researcher); [workspace:2] is the workspace "Launch"]`.
 * Refs missing from `names` (the user can't reach them) are left out;
 * nothing is returned when none are known.
 */
export default function describeMessageRefs({ text, names }: { text: string; names: MessageRefNames }) {
    const { bot_ids, workspace_ids } = messageRefIds({ texts: [text] });
    const parts: string[] = [];

    for (const id of bot_ids) {
        const bot = names.bots.get(id);

        if (bot) parts.push(`[bot:${id}] is ${bot.name}${bot.role ? ` (${bot.role})` : ""}`);
    }

    for (const id of workspace_ids) {
        const workspace = names.workspaces.get(id);

        if (workspace) parts.push(`[workspace:${id}] is the workspace "${workspace.name}"`);
    }

    return parts.length ? `[Mentions: ${parts.join("; ")}]` : "";
}
