import type { BUN_SQLITE_COBBLE_ALL_TYPEDEFS } from "@/db/types/db";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import checkAllowedJoins from "@/src/functions/backend/db/check-allowed-joins";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import type { AdminCrudAPIParams, ApiReqParams, TableType } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { req, table, user_types, body, id, query, user } = params;

    let final_sql_query = _.merge(query?.sql_query, body?.sql_query) || {};
    let final_query =
        _.merge<
            ApiReqParams<BUN_SQLITE_COBBLE_ALL_TYPEDEFS>,
            ApiReqParams<BUN_SQLITE_COBBLE_ALL_TYPEDEFS>
        >(query || {}, { sql_query: final_sql_query }) || {};

    const allowed_joins: TableType[] = ["user_types", "media"];

    const check_allowed_joins = checkAllowedJoins({
        joins: allowed_joins,
        query: final_sql_query,
    });

    if (!check_allowed_joins.success) {
        return check_allowed_joins;
    }

    const can_user_see_all_users = checkUserAccess({
        user_types,
        includes: ["admin"],
    });

    /**
     * `grabUsers` reads `user_id`, not `sql_query`, so anyone who can't
     * list users is pinned to their own record there.
     */
    const GET = await grabUsers({
        query: can_user_see_all_users.success
            ? final_query
            : { ...final_query, user_id: user.id },
        user_id: can_user_see_all_users.success ? id : user.id,
    });

    return GET;
}
