import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";

type Params = {
    chatroom: Pick<BUN_SQLITE_COBBLE_CHATROOMS, "workspace_id">;
    /**
     * A workspace, or (null) bots' own chats.
     */
    workspace_id: number | null;
};

/**
 * Whether a room belongs to a place: asked in that workspace, or (null)
 * from a bot's own chat.
 */
export default function chatroomInPlace({ chatroom, workspace_id }: Params) {
    return (Number(chatroom.workspace_id) || null) == (Number(workspace_id) || null);
}
