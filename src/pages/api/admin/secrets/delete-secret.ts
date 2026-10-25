import userAuth from "@/src/functions/backend/auth/user-auth";
import deleteUserSecret from "@/src/functions/backend/db/envs/delete-user-secret";
import grabPersonalSecrets from "@/src/functions/backend/db/envs/grab-personal-secrets";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SecretIdSchema } from "@/src/schemas/secret-request-schema";
import type { PersonalSecret } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Removes one of the session user's own personal secrets. Answers with
 * their fresh list.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<PersonalSecret[]>> = async ({ req, body }) => {
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

        const { env_id } = parseWithSchema({ schema: SecretIdSchema, data: body });
        const key = await deleteUserSecret({ user_id: user.id, env_id });

        await logEvent({
            title: "Secret removed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} removed their secret ${key}.`,
            metadata: { env_id, key },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Removed ${key}.`, singleRes: await grabPersonalSecrets({ user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
