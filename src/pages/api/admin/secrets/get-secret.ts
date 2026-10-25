import userAuth from "@/src/functions/backend/auth/user-auth";
import grabRevealableEnv from "@/src/functions/backend/db/secrets/grab-revealable-env";
import { SecretIdSchema } from "@/src/schemas/secret-request-schema";
import type { SecretRefView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?env_id=`: a secret a bot showed in the chat (`[secret:ID]`), as its
 * chip shows it before anyone asks for the value: the key, and whether
 * the session user may reveal it. Never the value.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SecretRefView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { env_id } = parseWithSchema({ schema: SecretIdSchema, data: query });
        const { env, can_reveal } = await grabRevealableEnv({ env_id, user_id: user.id });

        return {
            success: true,
            singleRes: { id: env.id, key: env.key, description: env.description, can_reveal },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
