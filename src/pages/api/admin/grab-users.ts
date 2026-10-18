import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import _ from "lodash";

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
        if (!user_types?.[0]) {
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
