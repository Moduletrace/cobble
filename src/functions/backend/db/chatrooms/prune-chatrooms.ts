import { grabChatroomKeepDays, grabChatroomMaxPerPlace } from "../app-settings/grab-chatroom-retention";
import deleteChatroomRows from "./delete-chatroom-rows";
import pruneChatroomsSql from "./prune-chatrooms-sql";

type Params = {
    /**
     * Only this place: a workspace, or (null) bots' own chats. Left out,
     * every place.
     */
    workspace_id?: number | null;
};

/**
 * Deletes the rooms past the install's retention (`pruneChatroomsSql`):
 * closed rooms older than `grabChatroomKeepDays`, and the oldest closed
 * ones once a place holds more than `grabChatroomMaxPerPlace`. Returns the
 * ids deleted.
 */
export default async function pruneChatrooms({ workspace_id }: Params = {}) {
    const cutoff = Date.now() - (await grabChatroomKeepDays()) * 24 * 60 * 60 * 1000;

    return await deleteChatroomRows({
        rooms: pruneChatroomsSql({ cutoff, max_per_place: await grabChatroomMaxPerPlace(), workspace_id }),
    });
}
