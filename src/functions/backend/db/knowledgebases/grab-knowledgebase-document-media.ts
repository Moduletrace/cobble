import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS,
    BUN_SQLITE_COBBLE_MEDIA,
} from "@/db/types/db";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import grabUserTypes from "../users/grab-user-types";

type Params = {
    media_id: number | string;
    user_id: number | string;
};

/**
 * A knowledgebase document's own file (its private `media` row) for a crew
 * manager, the same people Settings > Knowledgebases shows its documents
 * to, so "Open original" loads it.
 */
export default async function grabKnowledgebaseDocumentMedia({
    media_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_MEDIA | null> {
    const document = (
        await BunSQLite.sql<Pick<BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS, "id">>({
            sql: `SELECT id FROM knowledgebase_documents WHERE media_id = ? LIMIT 1`,
            values: [Number(media_id)],
        })
    ).payload?.[0];

    if (!document?.id) return null;

    if (!canManageCrew({ user_types: await grabUserTypes({ user_id }) })) return null;

    const media = await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
        sql: `SELECT * FROM media WHERE id = ? LIMIT 1`,
        values: [Number(media_id)],
    });

    return media.payload?.[0] || null;
}