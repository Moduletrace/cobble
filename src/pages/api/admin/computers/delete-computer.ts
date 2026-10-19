import userAuth from "@/src/functions/backend/auth/user-auth";
import deleteComputer from "@/src/functions/backend/db/computers/delete-computer";
import grabComputerDataDir from "@/src/functions/backend/db/computers/grab-computer-data-dir";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ComputerIdRequestSchema } from "@/src/schemas/computer-schema";
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
 * Deletes one of the session user's computers and its container (super
 * admins only). Its home directory stays on disk.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, body }) => {
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

        const { computer_id } = parseWithSchema({ schema: ComputerIdRequestSchema, data: body });

        const computer = await deleteComputer({ user_id: user.id, computer_id });

        await logEvent({
            title: "Computer deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the computer ${computer.name}.`,
            metadata: { computer_id, data_dir: grabComputerDataDir({ computer_id }) },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `${computer.name || "The computer"} is deleted. Its files are kept.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
