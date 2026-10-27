import deleteChatroomRows from "./delete-chatroom-rows";

type Params = {
    /**
     * Every room in this workspace, or every room of this user.
     */
    workspace_id?: number | string;
    user_id?: number | string;
};

/**
 * Deletes every room of a workspace or a user, with everything in them
 * (`deleteChatroomRows`).
 */
export default async function deleteChatrooms({ workspace_id, user_id }: Params) {
    if (!workspace_id && !user_id) return;

    await deleteChatroomRows({
        rooms: workspace_id
            ? { sql: `SELECT id FROM chatrooms WHERE workspace_id = ?`, values: [workspace_id] }
            : { sql: `SELECT id FROM chatrooms WHERE user_id = ?`, values: [user_id!] },
    });
}
