import hostDirectoryAccount from "./host-directory-account";

type BotRow = {
    id: number | string;
    kind: string;
};

type BotComputerRow = {
    bot_id: number | string;
    computer_id: number | string;
};

type WorkspaceBotRow = {
    bot_id: number | string;
    workspace_id: number | string;
};

type WorkspaceComputerRow = {
    workspace_id: number | string;
    computer_id: number | string;
};

type Params = {
    bots: BotRow[];
    bot_computers: BotComputerRow[];
    workspace_bots: WorkspaceBotRow[];
    workspace_computers: WorkspaceComputerRow[];
    /**
     * A computer's mount is in every bot's own folder that reaches it, so
     * every bot there sees it. A workspace's mount is in the workspace's
     * shared folder, so only the bots working there and the coordinator do.
     */
    scope: "computer" | "workspace";
    computer_id?: number | string;
    workspace_id?: number | string;
};

/**
 * The account ids (uids) of every bot that sees a host directory mounted in
 * a computer or a workspace, which is the set the folder's permissions have
 * to allow. The coordinator always sees both, since it reaches every
 * computer and works in every workspace.
 */
export default function hostDirectoryLinkUids({
    bots,
    bot_computers,
    workspace_bots,
    workspace_computers,
    scope,
    computer_id,
    workspace_id,
}: Params): number[] {
    const reachable = new Set<number>();

    for (const bot of bots) {
        if (bot.kind == "coordinator") reachable.add(Number(bot.id));
    }

    if (scope == "workspace") {
        for (const row of workspace_bots) {
            if (Number(row.workspace_id) == Number(workspace_id)) reachable.add(Number(row.bot_id));
        }
    } else {
        for (const row of bot_computers) {
            if (Number(row.computer_id) == Number(computer_id)) reachable.add(Number(row.bot_id));
        }

        const workspace_ids = workspace_computers
            .filter((row) => Number(row.computer_id) == Number(computer_id))
            .map((row) => Number(row.workspace_id));

        for (const row of workspace_bots) {
            if (workspace_ids.includes(Number(row.workspace_id))) reachable.add(Number(row.bot_id));
        }
    }

    const uids = new Set<number>();

    for (const bot_id of reachable) {
        const bot = bots.find((row) => Number(row.id) == bot_id);

        if (!bot) continue;

        uids.add(hostDirectoryAccount({ bot_id, bot_kind: bot.kind }).uid);
    }

    return [...uids].sort((left, right) => left - right);
}