import userAuth from "@/src/functions/backend/auth/user-auth";
import grabEnv from "@/src/functions/backend/db/envs/grab-env";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import restartComputer from "@/src/functions/backend/db/computers/restart-computer";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
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
 * Restarts a computer's container (super admins only: each one is a
 * container on this host), in the background, even with a job working on
 * it, since a stuck computer is why this exists. Its state arrives as
 * `server:computer-updated`. Returns the computer, `creating`.
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

        const name = computer.name || "The computer";

        const external =
            computer.kind == "main" && Boolean((await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim());

        if (external || !computer.container_id) {
            throw new AppError(`${name} has no container here to restart.`);
        }

        const current = (await grabUserComputers({ computer_id: computer.id }))[0];

        if (current?.status == "creating") {
            throw new AppError(`${name} is already starting up.`);
        }

        restartComputer({ computer_id: Number(computer.id) });

        await logEvent({
            title: "Computer restarted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} restarted the computer ${name}.`,
            metadata: { computer_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `${name} is restarting.`,
            singleRes: { ...current, status: "creating", error: null },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
