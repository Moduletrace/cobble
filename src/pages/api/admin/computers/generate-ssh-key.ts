import userAuth from "@/src/functions/backend/auth/user-auth";
import generateSshKey from "@/src/functions/backend/db/computers/generate-ssh-key";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import AppError from "@/src/utils/app-error";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Generates an Ed25519 install-wide SSH keypair (super admins only), stores
 * the encrypted private key, and returns the OpenSSH public key string.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{ public_key: string }>
> = async ({ req }) => {
    try {
        if (req.method != "POST") {
            throw new AppError("Method not allowed");
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: "Unauthorized", logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError("This user can only read records.");
        }

        if (!isPassThroughUser({ user_types })) {
            throw new AppError("Only a super admin can do that.");
        }

        const { public_key } = await generateSshKey();

        await logEvent({
            title: "SSH keypair generated",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} generated a new install-wide SSH keypair.`,
            ip_address: grabRequestIP(req),
        }).catch(() => {});

        return {
            success: true,
            msg: "Generated new SSH key.",
            singleRes: { public_key },
        };
    } catch (error: any) {
        return {
            success: false,
            msg: safeErrorMessage({
                error,
                fallback: "Couldn't generate SSH key.",
            }),
        };
    }
};
