import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import useConnectionEpoch from "@/src/hooks/use-connection-epoch";
import useServerEvent from "@/src/hooks/use-server-event";
import type { ChatroomSummary } from "@/src/types";
import chatroomInConversation from "@/src/utils/chatroom-in-conversation";
import mergeChatroom from "@/src/utils/merge-chatroom";

type Params = {
    bot_id: number;
    workspace_id: number | null;
};

/**
 * The latest requests a bot asked from this conversation, open ones first:
 * loaded here (no page carries them), kept current from
 * `server:chatroom-updated`, and read again after the socket may have
 * dropped, so a push missed meanwhile can't leave a finished one showing.
 */
export default function useConversationChatrooms({ bot_id, workspace_id }: Params) {
    const [chatrooms, setChatrooms] = useState<ChatroomSummary[]>([]);
    const epoch = useConnectionEpoch();

    useEffect(() => {
        if (!bot_id) return;

        const query = `requester_bot_id=${bot_id}${workspace_id ? `&workspace_id=${workspace_id}` : ""}`;

        fetchApi<{}, APIResponseObject<ChatroomSummary>>(`/api/admin/chatrooms/list?${query}`, { method: "GET" })
            .then((res) => {
                if (res?.success) setChatrooms(res.payload || []);
            })
            .catch(() => {});
    }, [bot_id, workspace_id, epoch]);

    useServerEvent({
        event: "server:chatroom-updated",
        onData: (room: ChatroomSummary) => {
            if (!chatroomInConversation({ chatroom: room, bot_id, workspace_id })) return;

            setChatrooms((prev) => mergeChatroom({ chatrooms: prev, chatroom: room }));
        },
    });

    return chatrooms;
}
