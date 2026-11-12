import BunSQLite from "@moduletrace/bun-sqlite";
import deleteMedia from "./delete-media";
import { unlinkedAttachmentIdsSql } from "./media-orphan-sql";

type Params = {
    /**
     * Media ids an upload put on a chat message, now that their message is
     * gone.
     */
    media_ids: number[];
};

/**
 * Deletes chat uploads whose message is being deleted, unless something
 * still points at the same media row: a bot file's bytes, a task's
 * deliverable, a knowledgebase document, a profile or bot picture. A chat
 * upload is its own `media` row (`upload-and-record-media`) and its
 * reference is the message's (`bot_message_media`), so an upload no
 * message shows is unreachable and only takes space. The bytes of a bot
 * file the upload was also copied into (`store-chat-attachments`) are a
 * separate row and stay.
 *
 * Returns the ids it deleted.
 */
export default async function deleteUnlinkedAttachmentMedia({ media_ids }: Params) {
    const query = unlinkedAttachmentIdsSql({ media_ids });

    if (!query) return [];

    const found = ((await BunSQLite.sql<{ id: number }>(query)).payload || []).map((row) =>
        Number(row.id),
    );

    if (!found.length) return [];

    await deleteMedia({ ids: found, can_delete_all_media: true });

    return found;
}