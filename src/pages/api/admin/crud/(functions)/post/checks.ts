import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import _ from "lodash";
import defaultChecks from "../default-checks";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const default_check = await defaultChecks(params);

    if (!default_check.success) {
        return default_check;
    }

    return {
        success: true,
    };
}
