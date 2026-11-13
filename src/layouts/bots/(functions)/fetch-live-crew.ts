import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { LiveCrewRequest } from "@/src/schemas/bot-schema";
import type { LiveCrewPayload } from "@/src/types";

/**
 * The rail's crew as it stands now: the bots in a workspace or the bots'
 * own chats (`workspace_id`), and the user's workspaces.
 */
export default async function fetchLiveCrew({ workspace_id }: LiveCrewRequest) {
    return await fetchApi<LiveCrewRequest, APIResponseObject<LiveCrewPayload>>(
        `/api/admin/bots/live-crew`,
        {
            method: "POST",
            body: { workspace_id },
        },
    );
}