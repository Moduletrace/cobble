import userAuth from "@/src/functions/backend/auth/user-auth";
import grabRevealableEnv from "@/src/functions/backend/db/secrets/grab-revealable-env";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SecretIdSchema } from "@/src/schemas/secret-request-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * A secret's value, for its chip's Reveal or Copy: only to whom
 * `canRevealEnv` allows. This is the one way a value leaves the app for a
 * browser from the chat; it never goes into a page, a message or the
 * history. Logged by key, never by value.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ value: string }>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { env_id } = parseWithSchema({ schema: SecretIdSchema, data: body });
        const { env, can_reveal } = await grabRevealableEnv({ env_id, user_id: user.id });

        if (!can_reveal) {
            throw new AppError(
                env.paradigm == "user" ? `You no longer have this bot.` : `Only a super admin can reveal this.`,
            );
        }

        await logEvent({
            title: "Secret revealed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} revealed ${env.key} (${env.paradigm} env #${env.id}) from the chat.`,
            metadata: { env_id: env.id, key: env.key, paradigm: env.paradigm },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: { value: env.value } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
