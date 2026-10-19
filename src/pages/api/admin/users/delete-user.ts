import userAuth from "@/src/functions/backend/auth/user-auth";
import deleteUser from "@/src/functions/backend/db/users/delete-user";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { UserIdRequestSchema } from "@/src/schemas/user-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Deletes a user and everything that's theirs, when the actor could
 * revoke them (`canRevokeUser`), never themselves.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, body }) => {
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

        const { user_id } = parseWithSchema({ schema: UserIdRequestSchema, data: body });
        const deleted = await deleteUser({ actor_user_id: user.id, actor_user_types: user_types || [], user_id });

        await logEvent({
            title: "User deleted",
            category: "auth",
            user_id: user.id,
            plain_text: `User #${user.id} deleted user #${user_id} (${deleted.email}).`,
            metadata: { user_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `${deleted.first_name || "The user"} is deleted.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
