import createKeyLock from "@/src/utils/create-key-lock";

/**
 * One conversation's writes go one at a time. Reading the active session,
 * storing the message and queueing its reply belong together: two sends in
 * flight together (a double submit, a retry firing beside the first) both
 * read the same full session, one rolls the conversation over, and the
 * other writes into the session that was just closed, where the user never
 * sees it. A reply carrying the conversation on is one of those writes.
 */
const conversationLock = createKeyLock();

type KeyParams = {
    user_id: number | string;
    bot_id: number;
    workspace_id?: number | null;
};

export function conversationLockKey({ user_id, bot_id, workspace_id }: KeyParams) {
    return `${user_id}:${bot_id}:${workspace_id || 0}`;
}

export default conversationLock;