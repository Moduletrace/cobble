import createKeyLock from "@/src/utils/create-key-lock";

/**
 * One conversation's writes go one at a time. Reading the active session,
 * storing the message and queueing its reply belong together: two sends in
 * flight together (a double submit, a retry firing beside the first) both
 * read the same full session, one rolls the conversation over, and the
 * other writes into the session that was just closed, where the user never
 * sees it.
 */
const conversationLock = createKeyLock();

export default conversationLock;