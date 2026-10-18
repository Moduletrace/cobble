import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import _ from "lodash";
import userAuth from "./user-auth";
import checkUserAccess from "./check-user-access";
import grabUsers from "../db/users/grab-users";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    query,
}) => {
    const { user, user_types } = await userAuth({ req });

    if (!user?.logged_in_status) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    try {
        const is_admin = checkUserAccess({
            user_types,
            includes: ["admin"],
        });

        if (
            !is_admin.success &&
            (!query?.user_id || query.user_id !== user.id)
        ) {
            return {
                success: false,
                msg: `Unauthorized`,
            };
        }

        return await grabUsers({
            query,
        });
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};
