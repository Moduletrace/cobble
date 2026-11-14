import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { MessageDetailsRequest } from "@/src/schemas/bot-schema";
import type { MessageDetails } from "@/src/types";

type Params = {
    message_id: MessageDetailsRequest["message_id"];
    /**
     * Every call and failure, for the report's copy, not the first the
     * modal lists.
     */
    full?: boolean;
};

/**
 * How one bot message was generated. `full` reads every call and failure
 * it took, which the modal's copy of the report needs.
 */
export default async function fetchMessageDetails({ message_id, full }: Params) {
    const query = new URLSearchParams({ message_id: String(message_id) });

    if (full) query.set("full", "1");

    return await fetchApi<{}, APIResponseObject<MessageDetails>>(
        `/api/admin/bots/message-details?${query.toString()}`,
        { method: "GET" },
    );
}