type Params = {
    bot_id: number | string;
    /**
     * The workspace the conversation is in; none for the bot's own chat.
     */
    workspace_id?: number | string | null;
    /**
     * A session to show other than the active one.
     */
    session_id?: number | string | null;
};

/**
 * The page of a conversation (`/admin/bots/<id>` or
 * `/admin/workspaces/<id>/bots/<id>`), opened on one of its sessions when
 * `session_id` is given.
 */
export default function conversationHref({ bot_id, workspace_id, session_id }: Params) {
    const path = workspace_id ? `/admin/workspaces/${workspace_id}/bots/${bot_id}` : `/admin/bots/${bot_id}`;

    return session_id ? `${path}?session_id=${session_id}` : path;
}
