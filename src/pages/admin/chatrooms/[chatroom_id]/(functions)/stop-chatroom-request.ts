import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ChatroomIdRequest } from "@/src/schemas/bot-schema";

/**
 * Stops a chatroom. Its new state arrives over the WebSocket.
 */
export default async function stopChatroomRequest({ chatroom_id }: ChatroomIdRequest) {
    return await fetchApi<ChatroomIdRequest, APIResponseObject>(`/api/admin/chatrooms/stop`, {
        method: "POST",
        body: { chatroom_id },
    });
}
