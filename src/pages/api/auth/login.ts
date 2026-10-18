import loginUser from "@/src/functions/backend/auth/login-user";
import verifySSOCode from "@/src/functions/backend/auth/verify-sso-code";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { LoginCodeRequestSchema } from "@/src/schemas/auth-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        const { sso_code } = parseWithSchema({
            schema: LoginCodeRequestSchema,
            data: body,
        });

        /**
         * Only codes issued by the site-wide login method complete a login.
         * In password mode that means the password step has passed.
         */
        const user_id = await verifySSOCode({
            req,
            sso_code,
            method: grabLoginMethod(),
        });

        return await loginUser({
            user_id,
            req,
        });
    } catch (error: unknown) {
        await logEvent({
            title: "SSO login failed",
            category: "auth",
            plain_text: `SSO login failed: ${
                error instanceof Error ? error.message : String(error)
            }`,
            ip_address: grabRequestIP(req),
        });

        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
