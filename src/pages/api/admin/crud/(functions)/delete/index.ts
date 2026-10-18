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
            msg: `Delete Unauthorized`,
        };
    }

    const res = await BunSQLite.delete({
        table,
        query: _.merge(query?.sql_query, body?.sql_query),
        targetId: id,
    });

    return res;
}
