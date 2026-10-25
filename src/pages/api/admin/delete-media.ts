import _ from "lodash";
import userAuth from "@/src/functions/backend/auth/user-auth";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async (
    params,
) => {
    const req = params.req;
    const body = params.body as ApiReqParams;

    if (req.method !== "DELETE") {
        return {
            success: false,
        };
    }

    const { user, user_types } = await userAuth({ req });

    if (!user?.logged_in_status) {
        return {
            success: false,
            msg: `Unauthorized`,
            logoutUser: true,
        };
    }

    try {
        if (isReadOnlyUser({ user_types })) {
            throw new Error(`This user can only read records.`);
        }

        const { id, ids, media_paradigm, user_id } = body;

        const can_delete_all_media = checkUserAccess({
            includes: ["admin"],
            user_types,
        });

        if (user_id && user.id !== user_id && !can_delete_all_media.success) {
            throw new Error(`Operation not allowed!`);
        }

        return await deleteMedia({
            id,
            ids,
            media_paradigm,
            user_id,
            can_delete_all_media: can_delete_all_media.success,
        });
    } catch (error: any) {
        return {
            success: false,
            msg: `API Error: ${error.message}`,
        };
    }
};
