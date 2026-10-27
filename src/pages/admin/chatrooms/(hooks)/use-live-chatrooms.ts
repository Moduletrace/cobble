import { useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { ChatroomSummary } from "@/src/types";
import chatroomInPlace from "@/src/utils/chatroom-in-place";
import mergeChatroom from "@/src/utils/merge-chatroom";

type Params = {
    chatrooms: ChatroomSummary[];
    /**
     * Inside a workspace, only its rooms join the list. Left out, every room.
     */
    workspace_id?: number;
};

/**
 * The page's rooms kept current from `server:chatroom-updated`.
 */
export default function useLiveChatrooms({ chatrooms, workspace_id }: Params) {
    const [live, setLive] = useState(chatrooms);

    useServerEvent({
        event: "server:chatroom-updated",
        onData: (room: ChatroomSummary) => {
            if (workspace_id && !chatroomInPlace({ chatroom: room, workspace_id })) return;

            setLive((prev) => mergeChatroom({ chatrooms: prev, chatroom: room }));
        },
    });

    return live;
}
