import _ from "lodash";
import type { BUN_SQLITE_BSQLITE_MEDIA } from "@/db/types/db";
import grabMediaFromParadigm from "@/src/functions/backend/db/media/grab-media-from-paraidigm";
import type { MediaParadigmType, TableType, User } from "@/src/types";
import grabDirNames from "@/src/utils/grab-dir-names";
import BunSQLite from "@moduletrace/bun-sqlite";
import { rmSync } from "fs";
import path from "path";

type Params = {
    id?: string | number;
    ids?: (string | number)[];
    media_paradigm?: MediaParadigmType;
    /**
     * ID of the user to be assigned to this media.
     * Different from logged in user id
     */
    user_id?: string | number | null;
    can_delete_all_media?: boolean;
};

export default async function deleteMedia(params: Params) {
    const { id, ids, media_paradigm, user_id, can_delete_all_media } = params;

    const { DATA_DIR } = grabDirNames();

    let media_to_delete = new Set<number>();

    if (media_paradigm && user_id) {
        const media_res = (
            await grabMediaFromParadigm({ media_paradigm, user_id })
        ).payload;

        if (media_res) {
            for (let i = 0; i < media_res.length; i++) {
                const media = media_res[i];
                if (!media?.id) continue;
                media_to_delete.add(media.id);
            }
        }
    }

    let media_ids_to_del: (number | string)[] = [];

    if (id) {
        media_ids_to_del.push(id);
    }

    if (ids) {
        media_ids_to_del.push(...ids);
    }

    if (media_ids_to_del[0]) {
        for (let i = 0; i < media_ids_to_del.length; i++) {
            const media_id_to_delete = media_ids_to_del[i];

            const target_media = (
                await BunSQLite.select<BUN_SQLITE_BSQLITE_MEDIA>({
                    table: "media",
                    targetId: media_id_to_delete,
                })
            ).singleRes;

            if (target_media?.id) {
                if (target_media.user_id !== user_id && !can_delete_all_media) {
                    throw new Error(`Can't delete this media!`);
                }

                media_to_delete.add(target_media.id);
            }
        }
    }

    const media_to_delete_array = Array.from(media_to_delete);

    for (let i = 0; i < media_to_delete_array.length; i++) {
        const media_id = media_to_delete_array[i];

        const target_media = (
            await BunSQLite.select<BUN_SQLITE_BSQLITE_MEDIA>({
                table: "media",
                targetId: media_id,
            })
        ).singleRes;

        if (!target_media?.id) {
            continue;
        }

        if (target_media.media_write_path) {
            rmSync(
                path.join(DATA_DIR, target_media.media_write_path),
                { force: true },
            );
        }

        if (target_media.media_thumbnail_write_path) {
            rmSync(
                path.join(DATA_DIR, target_media.media_thumbnail_write_path),
                { force: true },
            );
        }

        await BunSQLite.delete<BUN_SQLITE_BSQLITE_MEDIA, TableType>({
            table: "media",
            targetId: target_media.id,
        });
    }

    return {
        success: true,
    };
}
