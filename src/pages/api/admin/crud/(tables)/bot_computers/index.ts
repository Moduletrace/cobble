import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import get from "../../(functions)/get";
import post from "../../(functions)/post";
import put from "./put";
import del from "./del";

/**
 * Generic CRUD (super admin only), except that the coordinator's access to
 * the main computer can't be changed or removed.
 */
export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    const { req, user_types } = params;

    const is_super_admin = checkUserAccess({ user_types });

    if (!is_super_admin.success) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    switch (req.method) {
        case "GET":
            return await get(params);
        case "POST":
            return await post(params);
        case "PUT":
            return await put(params);
        case "DELETE":
            return await del(params);

        default:
            return {
                success: false,
            };
    }
}
