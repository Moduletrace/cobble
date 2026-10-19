import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import updateComputer from "@/src/functions/backend/db/computers/update-computer";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import type { ComputerWithStatus } from "@/src/types";
import { UpdateComputerRequestSchema } from "@/src/schemas/computer-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Updates a computer of the session user (super admins only: each one is
 * a container on this host). New resources (`cpus`, `memory_mb`) recreate
 * its container in the background, its files kept; its state arrives as
 * `server:computer-updated`. Returns the computer.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ComputerWithStatus>> = async ({ req, body }) => {
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

        if (!isPassThroughUser({ user_types })) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { computer_id, ...data } = parseWithSchema({ schema: UpdateComputerRequestSchema, data: body });

        const { recreating } = await updateComputer({ user_id: user.id, computer_id, data });

        const computer = (await grabUserComputers({ computer_id }))[0];
        const name = computer?.name || "The computer";

        await logEvent({
            title: "Computer updated",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} updated the computer ${name}.`,
            metadata: { computer_id, ...data, recreating },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: recreating ? `${name} is restarting with its new settings.` : `${name} saved.`,
            singleRes: recreating ? { ...computer, status: "creating", error: null } : computer,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
