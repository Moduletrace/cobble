import pruneChatrooms from "@/src/functions/backend/db/chatrooms/prune-chatrooms";

/**
 * Deletes chatrooms past the install's retention, in every place
 * (`pruneChatrooms`). Rooms over a place's cap are also pruned as each
 * room there closes.
 */
export default async function cronPruneChatrooms() {
    return { deleted: (await pruneChatrooms()).length };
}
