import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import deleteBotFile from "@/src/functions/backend/db/bot-files/delete-bot-file";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { DeleteBotFileRequestSchema } from "@/src/schemas/bot-file-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { StorageScope } from "@/src/utils/storage-access";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Deletes one of a conversation's files. A crew manager only, and never a
 * read-only user.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.id) return { success: false, msg: `Unauthorized`, logoutUser: true };
        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }
        if (!canManageCrew({ user_types: user_types || [] })) {
            throw new AppError(`Only a crew manager can delete files.`);
        }

        const { file_id } = parseWithSchema({ schema: DeleteBotFileRequestSchema, data: body });

        const file = await grabBotFile({
            scopes: await reachableScopes({ user_id: user.id, file_id }),
            file_id,
        });

        if (!file?.id) throw new AppError(`That file isn't here.`);

        await deleteBotFile({
            scopes: [{ scope: file.scope as any, owner_id: Number(file.owner_id) }],
            file_id: file.id,
        });

        await logEvent({
            title: "Bot file deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted ${file.path} from ${file.scope} ${file.owner_id}.`,
            metadata: { file_id: file.id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `${file.name || "The file"} is deleted.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

/**
 * The directories the user reaches: every worker's for a crew manager,
 * the coordinator's for the super admin, and every workspace it's in.
 */
async function reachableScopes({
    user_id,
    file_id,
}: {
    user_id: number;
    file_id: number;
}): Promise<StorageScope[]> {
    const { default: BunSQLite } = await import("@moduletrace/bun-sqlite");

    const res = await BunSQLite.sql<{ scope: string; owner_id: number }>({
        sql: `SELECT scope, owner_id FROM bot_files WHERE id = ? LIMIT 1`,
        values: [file_id],
    });

    const file = res.payload?.[0];

    if (!file?.owner_id) return [];

    if (file.scope == "workspace") {
        const workspace = await grabUserWorkspace({ workspace_id: file.owner_id, user_id });

        return workspace?.id ? [{ scope: "workspace", owner_id: Number(file.owner_id) }] : [];
    }

    const bot = await grabUserBot({ bot_id: file.owner_id, user_id });

    return bot?.id ? [{ scope: "bot", owner_id: Number(file.owner_id) }] : [];
}
