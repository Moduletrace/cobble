import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import type { SetBotComputerRequest } from "@/src/schemas/bot-schema";

/**
 * Switches the computer a bot works on (in a workspace, the workspace's
 * default). Returns its computers, the new one first.
 */
export default async function setBotComputer({ bot_id, computer_id, workspace_id }: SetBotComputerRequest) {
    return await fetchApi<
        SetBotComputerRequest,
        APIResponseObject<BUN_SQLITE_COBBLE_COMPUTERS>
    >(`/api/admin/bots/set-computer`, {
        method: "POST",
        body: { bot_id, computer_id, workspace_id },
    });
}
