import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { ChatroomSummary } from "@/src/types";
import chatroomInPlace from "@/src/utils/chatroom-in-place";
import mergeChatroom from "@/src/utils/merge-chatroom";

type Params = {
    /**
     * The workspace whose rooms the rail lists, or (null) those asked from
     * bots' own chats.
     */
    workspace_id: number | null;
};

/**
 * One place's latest chatrooms for the rail: loaded by the rail itself (no
 * page carries them), then kept current from `server:chatroom-updated`,
 * which only adds rooms of that place. Null until the first load.
 */
export default function useRailChatrooms({ workspace_id }: Params) {
    const [chatrooms, setChatrooms] = useState<ChatroomSummary[] | null>(null);

    useEffect(() => {
        setChatrooms(null);

        fetchApi<{}, APIResponseObject<ChatroomSummary>>(
            `/api/admin/chatrooms/list${workspace_id ? `?workspace_id=${workspace_id}` : ""}`,
            { method: "GET" },
        )
            .then((res) => {
                if (res?.success) setChatrooms(res.payload || []);
            })
            .catch(() => {});
    }, [workspace_id]);

    useServerEvent({
        event: "server:chatroom-updated",
        onData: (room: ChatroomSummary) => {
            if (!chatroomInPlace({ chatroom: room, workspace_id })) return;

            setChatrooms((prev) => mergeChatroom({ chatrooms: prev || [], chatroom: room }));
        },
    });

    return chatrooms;
}
