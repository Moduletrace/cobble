import _ from "lodash";
import checks from "./checks";
import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import BunSQLite from "@moduletrace/bun-sqlite";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, id, query } = params;

    const check = await checks(params);

    if (!check?.success) {
        return {
            success: false,
            msg: `Update Unauthorized`,
        };
    }

    if (!body?.update_data) {
        return {
            success: false,
            msg: `No data to update`,
        };
    }

    const res = await BunSQLite.update({
        table,
        data: body.update_data,
        query: _.merge(query?.sql_query, body?.sql_query),
        targetId: id,
    });

    return res;
}
