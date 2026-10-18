import _ from "lodash";
import defaultChecks from "../default-checks";
import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, user, user_types, body, id, query } = params;

    const default_check = await defaultChecks(params);

    if (!default_check.success) {
        return default_check;
    }

    return {
        success: true,
    };
}
