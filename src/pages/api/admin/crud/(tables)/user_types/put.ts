import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, body, user_types, id, query } = params;

    return {
        success: false,
        msg: `Can't update user_type. Can only delete and insert.`,
    };
}
