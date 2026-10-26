import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ConversationHistoryRequest } from "@/src/schemas/bot-schema";
import type { ConversationHistoryPayload } from "@/src/types";

/**
 * A conversation's history, loaded once the page is on screen: its active
 * session, or the one `session_id` names.
 */
export default async function fetchConversationHistory({
    bot_id,
    workspace_id,
    session_id,
}: ConversationHistoryRequest) {
    return await fetchApi<
        ConversationHistoryRequest,
        APIResponseObject<ConversationHistoryPayload>
    >(`/api/admin/bots/conversation-history`, {
        method: "POST",
        body: { bot_id, workspace_id, session_id },
    });
}
