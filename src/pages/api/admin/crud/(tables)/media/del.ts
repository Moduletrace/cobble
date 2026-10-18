import _ from "lodash";
import type { AdminCrudAPIParams, TableType } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import type { ServerQueryParam } from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_BSQLITE_ALL_TYPEDEFS,
    BUN_SQLITE_BSQLITE_MEDIA,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { rmSync } from "fs";
import path from "path";
import grabDirNames from "@/src/utils/grab-dir-names";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { user, user_types, body, id } = params;

    const can_delete_media = checkUserAccess({
        user_types,
        includes: ["admin"],
    });

    if (!can_delete_media.success) {
        return {
            success: false,
            msg: `Can't delete media`,
        };
    }

    let query = _.merge<
        ServerQueryParam<BUN_SQLITE_BSQLITE_ALL_TYPEDEFS>,
        ServerQueryParam<BUN_SQLITE_BSQLITE_ALL_TYPEDEFS>
    >(body?.sql_query || {}, {});

    const media_to_delete = await BunSQLite.select<
        BUN_SQLITE_BSQLITE_MEDIA,
        TableType
    >({
        table: "media",
        query,
        targetId: id,
    });

    if (!media_to_delete.payload) {
        return {
            success: false,
            msg: `No Media to Delete.`,
        };
    }

    const { DATA_DIR } = grabDirNames();

    for (let i = 0; i < media_to_delete.payload.length; i++) {
        const media = media_to_delete.payload[i];
        if (!media?.id) continue;

        if (media.media_write_path) {
            rmSync(path.join(DATA_DIR, media.media_write_path), {
                force: true,
            });
        }

        if (media.media_thumbnail_write_path) {
            rmSync(path.join(DATA_DIR, media.media_thumbnail_write_path), {
                force: true,
            });
        }

        await BunSQLite.delete<BUN_SQLITE_BSQLITE_MEDIA, TableType>({
            table: "media",
            targetId: media.id,
        });
    }

    return {
        success: true,
    };
}
