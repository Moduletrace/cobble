import _ from "lodash";
import defaultChecks from "../default-checks";
import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { user_types } = params;

    const default_check = await defaultChecks(params);

    if (!default_check.success) {
        return default_check;
    }

    const is_admin = checkUserAccess({
        user_types,
        includes: ["admin"],
    });

    if (!is_admin.success) {
        return is_admin;
    }

    return {
        success: true,
    };
}
