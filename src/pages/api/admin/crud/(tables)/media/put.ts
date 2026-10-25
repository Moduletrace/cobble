import type { BunSQLiteTables, BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import sanitizeMediaRowTextContent from "@/src/functions/backend/db/media/sanitize-media-row-text-content";
import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";
import { MediaUpdatableFields } from "./(data)/media-updatable-fields";

/**
 * Updates one media row's description (`MediaUpdatableFields`), by id: the
 * caller's own, or anyone's for an admin.
 */
export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, user_types, id, user } = params;

    if (!body?.update_data) {
        return {
            success: false,
            msg: `No Update Data`,
        };
    }

    if (!id) {
        return {
            success: false,
            msg: `No media id passed`,
        };
    }

    const update_data = _.pick(body.update_data, MediaUpdatableFields);

    if (!Object.keys(update_data)[0]) {
        return {
            success: false,
            msg: `No updatable fields passed`,
        };
    }

    const can_update_any = checkUserAccess({
        includes: ["admin"],
        user_types,
    });

    const existing = await BunSQLite.select<BUN_SQLITE_COBBLE_MEDIA, (typeof BunSQLiteTables)[number]>({
        table,
        query: { query: { id: { value: id } } },
    }).then((res) => res.payload?.[0] || null);

    if (!existing?.id || (!can_update_any.success && String(existing.user_id) !== String(user.id))) {
        return {
            success: false,
            msg: `Media not found`,
        };
    }

    /**
     * The row it replaces decides whether the new text belongs there, so
     * an update that only sends `text_content` is judged on the file's
     * real name and type.
     */
    const PUT = await BunSQLite.update({
        table,
        data: sanitizeMediaRowTextContent({ row: update_data, existing }),
        targetId: existing.id,
    });

    return PUT;
}
