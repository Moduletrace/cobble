import userAuth from "@/src/functions/backend/auth/user-auth";
import setUserGrant from "@/src/functions/backend/db/access/set-user-grant";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { UserGrantRequestSchema } from "@/src/schemas/user-schema";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import AppError from "@/src/utils/app-error";
import parseUserTypes from "@/src/utils/parse-user-types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import canUpdateUser from "@/src/utils/rbac/can-update-user";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Params = {
    req: Request;
    body: unknown;
    /**
     * Gives the worker or workspace when true, takes it away when false.
     */
    granted: boolean;
};

/**
 * `users/add-access` and `users/remove-access`: gives a user one worker
 * or workspace, or takes it away, for whoever manages the crew and may
 * update that user (`canManageCrew`, `canUpdateUser`). Returns the user.
 */
export default async function handleUserGrant({
    req,
    body,
    granted,
}: Params): Promise<APIResponseObject<BUN_SQLITE_COBBLE_USERS_JOIN>> {
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

        const { user_id, kind, id } = parseWithSchema({ schema: UserGrantRequestSchema, data: body });
        const target = (await grabUsers({ user_id })).singleRes;

        if (!target?.id) {
            throw new AppError(`There's no such user.`);
        }

        const allowed =
            canManageCrew({ user_types }) &&
            canUpdateUser({
                actor_user_types: user_types,
                actor_user_id: user.id,
                target_user_id: user_id,
                target_user_types: parseUserTypes({ user_types: target.user_types }).map((user_type) => ({ user_type })),
                update_fields: [],
            });

        if (!allowed) {
            throw new AppError(`You can't do that.`);
        }

        await setUserGrant({ user_id, kind, id, granted });

        await logEvent({
            title: granted ? "User access given" : "User access removed",
            category: "auth",
            user_id: user.id,
            plain_text: `User #${user.id} ${granted ? "gave" : "took"} ${kind} #${id} ${granted ? "to" : "from"} user #${user_id}.`,
            metadata: { user_id, kind, id, granted },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: (await grabUsers({ user_id })).singleRes };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
}
