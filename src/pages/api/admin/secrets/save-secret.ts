import userAuth from "@/src/functions/backend/auth/user-auth";
import grabAllEnvs from "@/src/functions/backend/db/envs/grab-all-envs";
import grabPersonalSecrets from "@/src/functions/backend/db/envs/grab-personal-secrets";
import saveUserSecret from "@/src/functions/backend/db/envs/save-user-secret";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveUserSecretSchema } from "@/src/schemas/secret-request-schema";
import type { PersonalSecret } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Replaces the value of one of the session user's own personal secrets.
 * Answers with their fresh list. Logged by key, never by value.
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

        const { env_id, value } = parseWithSchema({ schema: SaveUserSecretSchema, data: body });
        const env = (await grabAllEnvs()).find(
            (e) => e.id == env_id && e.paradigm == "user" && e.user_id == Number(user.id),
        );

        if (!env?.bot_id) throw new AppError(`That secret no longer exists.`);

        await saveUserSecret({ user_id: user.id, bot_id: env.bot_id, key: env.key, value });

        await logEvent({
            title: "Secret saved",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} replaced ${env.key} for bot #${env.bot_id}.`,
            metadata: { env_id, key: env.key, bot_id: env.bot_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Saved ${env.key}.`, singleRes: await grabPersonalSecrets({ user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
