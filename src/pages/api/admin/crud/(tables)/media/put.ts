import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
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

    const PUT = await BunSQLite.update({
        table,
        data: body?.update_data,
        targetId,
        query: final_sql_query,
    });

    return PUT;
}
