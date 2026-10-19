import userAuth from "@/src/functions/backend/auth/user-auth";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import ensureMainComputer from "@/src/functions/backend/db/computers/ensure-main-computer";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import saveUser from "@/src/functions/backend/db/users/save-user";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import { SaveUserRequestSchema } from "@/src/schemas/user-schema";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import canCreateUser from "@/src/utils/rbac/can-create-user";
import canUpdateUser from "@/src/utils/rbac/can-update-user";
import parseUserTypes from "@/src/utils/parse-user-types";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Creates a user (`canCreateUser`) or updates one (`canUpdateUser`):
 * name, email, username, password and user types, each type checked
 * against the assignment matrix. A new user gets their coordinator and main computer
 * straight away, as at signup. Returns the user.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BUN_SQLITE_COBBLE_USERS_JOIN>> = async ({ req, body }) => {
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

        const data = parseWithSchema({ schema: SaveUserRequestSchema, data: body });

        const target = data.user_id ? (await grabUsers({ user_id: data.user_id })).singleRes : null;

        const allowed = data.user_id
            ? canUpdateUser({
                  actor_user_types: user_types,
                  actor_user_id: user.id,
                  target_user_id: data.user_id,
                  target_user_types: parseUserTypes({ user_types: target?.user_types }).map((user_type) => ({ user_type })),
                  update_fields: target && target.email != data.email.trim().toLowerCase() ? ["email"] : [],
              })
            : canCreateUser({ user_types });

        if (!allowed) {
            throw new AppError(`You can't do that.`);
        }
        const { user_id, created } = await saveUser({ ...data, actor_user_types: user_types || [] });

        if (created) {
            /**
             * The account exists now; `/admin/bots` creates both on their
             * first visit if this fails.
             */
            await ensureCoordinatorBot({ user_id })
                .then((coordinator_id) => ensureMainComputer({ user_id, coordinator_id }))
                .catch((error) =>
                    logError({
                        title: "Coordinator or main computer not created with the user",
                        error,
                        user_id,
                        ip_address: grabRequestIP(req),
                    }).catch(() => {}),
                );
        }

        await logEvent({
            title: created ? "User created" : "User updated",
            category: "auth",
            user_id: user.id,
            plain_text: `User #${user.id} ${created ? "created" : "updated"} user #${user_id}.`,
            metadata: { user_id, user_types: data.user_types, password_changed: Boolean(data.password) },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: created ? `${data.first_name} can sign in now.` : `Saved.`,
            singleRes: (await grabUsers({ user_id })).singleRes,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
