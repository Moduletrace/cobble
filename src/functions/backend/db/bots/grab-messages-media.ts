import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import mediaColumns from "@/src/functions/backend/db/media/media-columns";

type Params = {
    message_ids: number[];
    /**
     * Also read `text_content`, the extracted text a reply hands a
     * document to the model as. Off by default: it is the largest column
     * in the table and nothing else here uses it.
     */
    with_text_content?: boolean;
};

export type MessageMediaRow = BUN_SQLITE_COBBLE_MEDIA & { message_id: number };

/**
 * The files attached to these messages, by message id, in the order they
 * were attached.
 */
export default async function grabMessagesMedia({
    message_ids,
    with_text_content,
}: Params) {
    const by_message = new Map<number, MessageMediaRow[]>();
    const ids = [...new Set(message_ids.filter(Boolean))];

    if (!ids.length) return by_message;

    const columns = mediaColumns({ alias: "m", with_text_content });

    const rows =
        (
            await BunSQLite.sql<MessageMediaRow>({
                sql: `SELECT ${columns}, l.message_id FROM bot_message_media l
                    JOIN media m ON m.id = l.media_id
                    WHERE l.message_id IN (${ids.map(() => "?").join(", ")})
                    ORDER BY l.id ASC`,
                values: ids,
            })
        ).payload || [];

    for (const row of rows) {
        const list = by_message.get(row.message_id) || [];
        list.push(row);
        by_message.set(row.message_id, list);
    }

    return by_message;
}
