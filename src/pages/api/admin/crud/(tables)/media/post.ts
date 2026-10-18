import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, user_types, user } = params;

    let final_insert_data: BUN_SQLITE_COBBLE_MEDIA[] = [
        ...(body?.insert_data || []),
    ].map((d) => ({ ...d, user_id: user.id }));

    const is_user_allowed_to_post_any = checkUserAccess({
        includes: ["admin"],
        user_types,
    });

    if (!is_user_allowed_to_post_any.success) {
        final_insert_data = final_insert_data.map((fid) => ({
            ...fid,
            user_id: user.id,
        }));
    }

    const POST = await BunSQLite.insert({
        table,
        data: final_insert_data,
        update_on_duplicate: body?.update_on_duplicate,
    });

    return POST;
}
