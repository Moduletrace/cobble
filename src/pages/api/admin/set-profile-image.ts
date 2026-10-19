import userAuth from "@/src/functions/backend/auth/user-auth";
import setProfileImage from "@/src/functions/backend/db/profile-images/set-profile-image";
import { SetProfileImageRequestSchema } from "@/src/schemas/profile-image-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Sets or removes the picture of one of the session user's bots or
 * workspaces. Returns the new `image_media_id` (null once removed).
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{ image_media_id: number | null }>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { target, id, data_url } = parseWithSchema({
            schema: SetProfileImageRequestSchema,
            data: body,
        });

        return {
            success: true,
            msg: data_url ? `Picture saved.` : `Picture removed.`,
            singleRes: await setProfileImage({ user_id: user.id, target, id, data_url }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
