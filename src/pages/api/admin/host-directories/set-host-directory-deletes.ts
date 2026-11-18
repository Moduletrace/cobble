import userAuth from "@/src/functions/backend/auth/user-auth";
import setHostDirectoryDeletes from "@/src/functions/backend/db/host-directories/set-host-directory-deletes";
import { SetHostDirectoryDeletesRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Whether one link asks the user before a bot deletes anything in its
 * folder: deleting on the host machine can't be undone.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ host_directory_id: number }>> = async ({ req, body }) => {
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

        const data = parseWithSchema({ schema: SetHostDirectoryDeletesRequestSchema, data: body });

        await setHostDirectoryDeletes({
            user_id: user.id,
            host_directory_id: data.host_directory_id,
            computer_id: data.computer_id || undefined,
            workspace_id: data.workspace_id || undefined,
            gate_deletes: data.gate_deletes,
        });

        return {
            success: true,
            msg: data.gate_deletes
                ? `The bots now ask you before deleting anything there.`
                : `The bots can delete there without asking you.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};