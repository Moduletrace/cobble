import userAuth from "@/src/functions/backend/auth/user-auth";
import grabSshPublicKey from "@/src/functions/backend/db/computers/grab-ssh-public-key";
import saveSshKey from "@/src/functions/backend/db/computers/save-ssh-key";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveSshKeyRequestSchema } from "@/src/schemas/computer-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Saves and validates an install-wide SSH private key and optional passphrase
 * (super admins only). Returns the derived OpenSSH public key for display.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{ public_key: string | null }>
> = async ({ req, body }) => {
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

        const { private_key, passphrase } = parseWithSchema({
            schema: SaveSshKeyRequestSchema,
            data: body,
        });

        await saveSshKey({ private_key, passphrase });
        const public_key = await grabSshPublicKey();

        await logEvent({
            title: "SSH private key updated",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} updated the install-wide SSH private key.`,
            ip_address: grabRequestIP(req),
        }).catch(() => {});

        return {
            success: true,
            msg: "SSH key saved.",
            singleRes: { public_key },
        };
    } catch (error: any) {
        return {
            success: false,
            msg: safeErrorMessage({
                error,
                fallback: "Couldn't save SSH key.",
            }),
        };
    }
};
