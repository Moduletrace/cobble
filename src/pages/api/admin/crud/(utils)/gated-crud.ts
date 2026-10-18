import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

/**
 * # Shared admin-gated CRUD actions for app tables.
 * Gates every action on `admin` (or super_admin) then performs the
 * standard table operation. Keeps table folders thin.
 */
export async function gatedCrudGet(
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, id, query, user_types } = params;

    const access = checkUserAccess({ user_types, includes: ["admin"] });

    if (!access.success) {
        return access;
    }

    const final_sql_query = _.merge(query?.sql_query, body?.sql_query);

    return await BunSQLite.select({
        table,
        query: final_sql_query,
        targetId: id,
        count: query?.count || body?.count,
    });
}

export async function gatedCrudPost(
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, user_types } = params;

    const access = checkUserAccess({ user_types, includes: ["admin"] });

    if (!access.success) {
        return access;
    }

    if (!body?.insert_data) {
        return {
            success: false,
            msg: `No data to insert`,
        };
    }

    return await BunSQLite.insert({
        table,
        data: [...body.insert_data],
        update_on_duplicate: body.update_on_duplicate,
    });
}

export async function gatedCrudPut(
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, id, query, user_types } = params;

    const access = checkUserAccess({ user_types, includes: ["admin"] });

    if (!access.success) {
        return access;
    }

    if (!body?.update_data) {
        return {
            success: false,
            msg: `No data to update`,
        };
    }

    return await BunSQLite.update({
        table,
        data: body.update_data,
        query: _.merge(query?.sql_query, body?.sql_query),
        targetId: id,
    });
}

export async function gatedCrudDelete(
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, id, query, user_types } = params;

    const access = checkUserAccess({ user_types, includes: ["admin"] });

    if (!access.success) {
        return access;
    }

    return await BunSQLite.delete({
        table,
        query: _.merge(query?.sql_query, body?.sql_query),
        targetId: id,
    });
}