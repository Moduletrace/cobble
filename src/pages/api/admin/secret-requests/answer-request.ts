import userAuth from "@/src/functions/backend/auth/user-auth";
import answerSecretRequest from "@/src/functions/backend/db/secret-requests/answer-secret-request";
import grabSecretRequestView from "@/src/functions/backend/db/secret-requests/grab-secret-request-view";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AnswerSecretRequestSchema } from "@/src/schemas/secret-request-schema";
import type { SecretRequestView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The session user typed the secret a bot asked them for into its card:
 * saved as their personal secret for that bot. Answers with the request
 * as it now stands, never the value. Logged by key only.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SecretRequestView>> = async ({ req, body }) => {
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

        const { request_id, value } = parseWithSchema({ schema: AnswerSecretRequestSchema, data: body });
        const request = await answerSecretRequest({ request_id, user_id: user.id, value });

        await logEvent({
            title: "Secret saved",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} saved ${request.key} for bot #${request.bot_id}, as bot #${request.bot_id} asked (request #${request.id}).`,
            metadata: { request_id: request.id, key: request.key, bot_id: request.bot_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${request.key}.`,
            singleRes: await grabSecretRequestView({ request_id, user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
