import userAuth from "@/src/functions/backend/auth/user-auth";
import grabComputerTarget from "@/src/functions/backend/db/computers/grab-computer-target";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import saveSshHome from "@/src/functions/backend/db/computers/save-ssh-home";
import runSshCommand from "@/src/functions/backend/computers/ssh/run-ssh-command";
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

export type TestComputerResult = {
    uname: string;
    home: string;
};

/**
 * Tests an SSH computer connection by running `uname -a` and `printf %s "$HOME"`.
 * Updates and returns the learned home directory.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<TestComputerResult>
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

        if (computer.connection !== "ssh") {
            throw new AppError("Test connection is for SSH computers.");
        }

        const target = await grabComputerTarget({ computer_id });

        if (!target?.ready || target.connection !== "ssh") {
            throw new AppError("This SSH computer has missing host or user configuration.");
        }

        const unameRes = await runSshCommand({
            computer: { ssh: target.ssh, computer_id: Number(computer.id) },
            command: "uname -a",
            timeout_ms: 10_000,
        });

        const homeRes = await runSshCommand({
            computer: { ssh: target.ssh, computer_id: Number(computer.id) },
            command: 'printf %s "$HOME"',
            timeout_ms: 10_000,
        });

        const home = homeRes.output.trim();
        const uname = unameRes.output.trim();

        if (home) {
            await saveSshHome({ computer_id: Number(computer.id), home });
        }

        await logEvent({
            title: "SSH computer tested",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} tested SSH computer ${computer.name}.`,
            metadata: { computer_id, home, uname },
            ip_address: grabRequestIP(req),
        }).catch(() => {});

        return {
            success: true,
            msg: "Connection successful.",
            singleRes: { uname, home },
        };
    } catch (error: any) {
        return {
            success: false,
            msg: safeErrorMessage({
                error,
                fallback: "Couldn't reach SSH computer.",
            }),
        };
    }
};
