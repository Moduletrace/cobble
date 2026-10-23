import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA_PARADIGMS } from "@/db/types/db";
import { PictureParadigms, type PictureTarget } from "./copy-media-as-picture";

type Params = {
    media_id: number | string;
    /**
     * Which picture it has to be: a bot's or a workspace's.
     */
    target: PictureTarget;
};

/**
 * Whether a media row is a picture of that kind. Only one is deleted when
 * a picture is replaced: a row a chat message still attaches is left where
 * it is, since removing it would break a message the user can still scroll
 * to.
 */
export default async function isPictureMedia({ media_id, target }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA_PARADIGMS>({
        sql: `SELECT media_paradigm FROM media_paradigms WHERE media_id = ?`,
        values: [Number(media_id)],
    });

    return (res.payload || []).some((row) => row.media_paradigm == PictureParadigms[target]);
}
