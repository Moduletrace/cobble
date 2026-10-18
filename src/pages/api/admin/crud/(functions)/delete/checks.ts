import _ from "lodash";
import defaultChecks from "../default-checks";
import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { table, user, user_types, body, id, query } = params;

    const default_check = await defaultChecks(params);
    const is_super_admin = checkUserAccess({ user_types }).success;

    if (!default_check.success) {
        return default_check;
    }

    if (!is_super_admin) {
        return {
            success: false,
        };
    }

    return {
        success: true,
    };
}
