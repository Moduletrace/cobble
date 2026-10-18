import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import grabMedia from "@/src/functions/backend/db/media/grab-media";
import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, user_types, body, id, query, user } = params;

    let final_sql_query = _.merge(query?.sql_query, body?.sql_query) || {};

    delete final_sql_query.join;

    const can_user_see_all_media = checkUserAccess({
        user_types,
        includes: ["admin"],
    });

    if (!can_user_see_all_media.success) {
        final_sql_query.query = {
            ...final_sql_query.query,
            user_id: {
                value: user.id,
            },
        };
    }

    const GET = await grabMedia({ query, user });

    return GET;
}
