import userAuth from "@/src/functions/backend/auth/user-auth";
import forgetSshHostKey from "@/src/functions/backend/db/computers/forget-ssh-host-key";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ComputerIdRequestSchema } from "@/src/schemas/computer-schema";
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
 * Clears the stored host key fingerprint for an SSH computer (super admins only).
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{ ok: boolean }>
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

        const { computer_id } = parseWithSchema({
            schema: ComputerIdRequestSchema,
            data: body,
        });

        const computer = await grabUserComputer({ computer_id, user_id: user.id });

        if (!computer?.id) {
            throw new AppError("Computer not found.");
        }

        if (computer.connection != "ssh") {
            throw new AppError("That's a docker computer setting.");
        }

        await forgetSshHostKey({ computer_id: Number(computer.id) });

        await logEvent({
            title: "SSH host key fingerprint cleared",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} cleared the host key fingerprint for computer ${computer.name}.`,
            metadata: { computer_id },
            ip_address: grabRequestIP(req),
        }).catch(() => {});

        return {
            success: true,
            msg: "Cleared host key fingerprint.",
            singleRes: { ok: true },
        };
    } catch (error: any) {
        return {
            success: false,
            msg: safeErrorMessage({
                error,
                fallback: "Couldn't clear host key fingerprint.",
            }),
        };
    }
};
