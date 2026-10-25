import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import pushBotCreated from "@/src/bots-queue/push-bot-created";
import AppError from "@/src/utils/app-error";
import addBotToWorkspace from "./add-bot-to-workspace";
import grabUserWorkspaces from "./grab-user-workspaces";
import grabWorkspaceBots from "./grab-workspace-bots";

type Params = {
    user_id: number | string;
    bot: BUN_SQLITE_COBBLE_BOTS;
    workspace_id: number | string;
};

/**
 * A bot can only work in a workspace it's in. Anyone else is added first
 * (crew managers only, checked by `addBotToWorkspace`), since handing work
 * over is exactly the moment someone decides who does the work where.
 * Returns the sentence saying so, or "" when it was already there.
 */
export default async function ensureBotInWorkspace({ user_id, bot, workspace_id }: Params) {
    if (!bot.id) return "";

    const workspaces = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);
    const workspace = workspaces.find((w) => w.id == Number(workspace_id));

    if (!workspace) {
        throw new AppError(
            `No workspace has id ${workspace_id}. Workspaces: ${
                workspaces.map((w) => `${w.id}: ${w.name}`).join("; ") || "none"
            }.`,
        );
    }

    const members = await grabWorkspaceBots({ user_id, workspace_id: Number(workspace.id) });

    if (members.some((member) => member.id == bot.id)) return "";

    await addBotToWorkspace({ user_id, workspace_id: Number(workspace.id), bot_id: Number(bot.id) });
    await pushBotCreated({ bot });

    return ` ${bot.name} wasn't in "${workspace.name}", so it was added to it first.`;
}
