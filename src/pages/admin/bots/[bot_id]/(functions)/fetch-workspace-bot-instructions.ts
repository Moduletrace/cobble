import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { WorkspaceBotRequest } from "@/src/schemas/workspace-schema";
import type { WorkspaceBotInstructions } from "@/src/types";

/**
 * A bot's instructions and memory for one workspace, for its editor.
 */
export default async function fetchWorkspaceBotInstructions({ workspace_id, bot_id }: WorkspaceBotRequest) {
    return await fetchApi<WorkspaceBotRequest, APIResponseObject<WorkspaceBotInstructions>>(
        `/api/admin/workspaces/workspace-bot`,
        { method: "POST", body: { workspace_id, bot_id } },
    );
}
