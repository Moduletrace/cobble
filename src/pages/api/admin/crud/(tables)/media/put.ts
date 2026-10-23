import type { BunSQLiteTables, BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import sanitizeMediaRowTextContent from "@/src/functions/backend/db/media/sanitize-media-row-text-content";
import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, user_types, id, query, user } = params;

    if (!body?.update_data) {
        return {
            success: false,
            msg: `No Update Data`,
        };
    }

    const is_user_allowed_to_put = checkUserAccess({
        includes: ["admin"],
        user_types,
    });

    let final_sql_query = _.merge(query?.sql_query, body?.sql_query) || {};
    let targetId = id;

    if (!is_user_allowed_to_put.success) {
        final_sql_query = {};
        targetId = user.id;
    }

    /**
     * The row it replaces decides whether the new text belongs there, so
     * an update that only sends `text_content` is judged on the file's
     * real name and type.
     */
    const existing = targetId
        ? await BunSQLite.select<BUN_SQLITE_COBBLE_MEDIA, (typeof BunSQLiteTables)[number]>({
              table,
              query: { query: { id: { value: targetId } } },
          }).then((res) => res.payload?.[0] || null)
        : null;

    const PUT = await BunSQLite.update({
        table,
        data: sanitizeMediaRowTextContent({ row: body.update_data, existing }),
        targetId,
        query: final_sql_query,
    });

    return PUT;
}
