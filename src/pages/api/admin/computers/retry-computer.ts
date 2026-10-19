import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import provisionComputer from "@/src/functions/backend/db/computers/provision-computer";
import type { ComputerWithStatus } from "@/src/types";
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
 * Sets up a computer's container again after it failed (super admins
 * only), in the background. Returns the computer, `creating`.
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

        const { computer_id } = parseWithSchema({ schema: ComputerIdRequestSchema, data: body });

        const computer = await grabUserComputer({ computer_id, user_id: user.id });

        if (!computer?.id) {
            throw new AppError(`Computer not found.`);
        }

        const current = (await grabUserComputers({ computer_id: computer.id }))[0];

        if (current?.status == "creating") {
            throw new AppError(`${computer.name || "The computer"} is already being set up.`);
        }

        provisionComputer({ computer_id: Number(computer.id) });

        return {
            success: true,
            msg: `Setting ${computer.name || "the computer"} up again.`,
            singleRes: { ...current, status: "creating", error: null },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
