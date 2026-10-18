import _ from "lodash";
import checks from "./checks";
import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import BunSQLite from "@moduletrace/bun-sqlite";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body } = params;

    const check = await checks(params);

    if (!check?.success) {
        return {
            success: false,
            msg: `Insert Unauthorized`,
        };
    }

    if (!body?.insert_data) {
        return {
            success: false,
            msg: `No data to insert`,
        };
    }

    let final_insert_data = [...body.insert_data];

    const res = await BunSQLite.insert({
        table,
        data: final_insert_data,
        update_on_duplicate: body.update_on_duplicate,
    });

    return res;
}
