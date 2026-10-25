import { workspaceAdminsLine } from "@/src/data/harness-prompts";
import grabWorkspaceAdmins from "@/src/functions/backend/db/bot-types/grab-workspace-admins";

/**
 * For a bot in a workspace that has admins other than itself: the line
 * naming them (`workspaceAdminsLine`).
 */
export default async function workspaceAdminsNote({
    bot_id,
    workspace_id,
}: {
    bot_id: number | string | "" | undefined;
    workspace_id?: number | string | null;
}) {
    if (!workspace_id) return "";

    const admins = (await grabWorkspaceAdmins({ workspace_id })).filter((admin) => admin.id != Number(bot_id));

    return admins.length ? workspaceAdminsLine({ admins }) : "";
}
