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
    /**
     * The room the message was posted in: a chatroom's message is read
     * from its own route, an answer in a bot's conversation from the
     * bot's.
     */
    chatroom_id?: number;
};

/**
 * How one bot message was generated. `full` reads every call and failure
 * it took, which the modal's copy of the report needs.
 */
export default async function fetchMessageDetails({ message_id, full, chatroom_id }: Params) {
    const query = new URLSearchParams({ message_id: String(message_id) });

    if (full) query.set("full", "1");

    const url = chatroom_id ? `/api/admin/chatrooms/message-details` : `/api/admin/bots/message-details`;

    return await fetchApi<{}, APIResponseObject<MessageDetails>>(`${url}?${query.toString()}`, { method: "GET" });
}