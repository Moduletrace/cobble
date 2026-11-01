import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ChatroomIdRequest } from "@/src/schemas/bot-schema";

/**
 * Tries a failed or stopped chatroom again. Its new state arrives over the
 * WebSocket.
 */
export default async function retryChatroomRequest({ chatroom_id }: ChatroomIdRequest) {
    return await fetchApi<ChatroomIdRequest, APIResponseObject>(`/api/admin/chatrooms/retry`, {
        method: "POST",
        body: { chatroom_id },
    });
}
