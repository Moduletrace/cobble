import _ from "lodash";
import users from "./(tables)/users";
import userTypes from "./(tables)/user_types";
import media from "./(tables)/media";
import botComputers from "./(tables)/bot_computers";
import get from "./(functions)/get";
import put from "./(functions)/put";
import del from "./(functions)/delete";
import post from "./(functions)/post";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import type { AdminCrudAPIParams, ApiReqParams, TableType } from "@/src/types";
import userAuth from "@/src/functions/backend/auth/user-auth";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { PrivateTables } from "@/src/dict/private-tables";
import safeErrorMessage from "@/src/utils/safe-error-message";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async (
    params,
) => {
    const req = params.req;
    const body = params.body as ApiReqParams;
    const query = params.query as ApiReqParams;

    const { user, user_types } = await userAuth({ req });

    if (!user?.logged_in_status) {
        return {
            success: false,
            msg: `Unauthorized`,
            logoutUser: true,
        };
    }

    if (!user_types?.[0]) {
        return {
            success: false,
            msg: `User types not found`,
            logoutUser: true,
        };
    }

    try {
        const [table, id] = params.query.paths.split("/") as [
            TableType,
            string | number,
        ];

        if (PrivateTables.includes(table)) {
            return {
                success: false,
                msg: `Unauthorized`,
            };
        }

        if (isReadOnlyUser({ user_types }) && !req.method.match(/get/)) {
            const is_self_user_profile_update =
                req.method == "PUT" &&
                table == "users" &&
                (!id || String(id) === String(user.id));

            if (!is_self_user_profile_update) {
                throw new Error(`This user can only read records.`);
            }
        }

        const crud_params: AdminCrudAPIParams = {
            table,
            id,
            user: user || undefined,
            user_types: user_types || [],
            body,
            query,
            req,
        };

        switch (table) {
            case "users":
                return await users(crud_params);
            case "user_types":
                return await userTypes(crud_params);
            case "media":
                return await media(crud_params);
            case "bot_computers":
                return await botComputers(crud_params);

            default:
                break;
        }

        const is_super_admin = checkUserAccess({ user_types });

        if (!is_super_admin.success) {
            return {
                success: false,
                msg: `Unauthorized`,
            };
        }

        switch (req.method) {
            case "GET":
                return await get(crud_params);
            case "POST":
                return await post(crud_params);
            case "PUT":
                return await put(crud_params);
            case "DELETE":
                return await del(crud_params);

            default:
                return {
                    success: false,
                    msg: `Unhandled`,
                };
        }
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
