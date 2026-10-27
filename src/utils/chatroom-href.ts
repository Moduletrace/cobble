import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";

type Params = {
    chatroom: Pick<BUN_SQLITE_COBBLE_CHATROOMS, "id" | "workspace_id">;
};

/**
 * Where a chatroom opens: inside its workspace (with the workspace's rail)
 * when it was asked from one, else at `/admin/chatrooms/<id>`.
 */
export default function chatroomHref({ chatroom }: Params) {
    return chatroom.workspace_id
        ? `/admin/workspaces/${chatroom.workspace_id}/chatrooms/${chatroom.id}`
        : `/admin/chatrooms/${chatroom.id}`;
}
