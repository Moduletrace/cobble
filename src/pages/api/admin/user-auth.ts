import userAuth from "@/src/functions/backend/auth/user-auth";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
}) => {
    const { user, user_types } = await userAuth({ req });

    if (!user?.logged_in_status) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }
    return {
        success: true,
        singleRes: user,
        payload: user_types,
    };
};