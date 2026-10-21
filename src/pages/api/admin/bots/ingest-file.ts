import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import { IngestBotFileRequestSchema } from "@/src/schemas/bot-file-schema";
import enqueueFileIngest from "@/src/file-ingest/enqueue-file-ingest";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { StorageScope } from "@/src/utils/storage-access";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Queues a conversation's file to be read again and re-embedded, for when
 * a search misses something the user knows is in it.
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
            throw new AppError(`Only a crew manager can re-read files.`);
        }

        const { file_id, read_media } = parseWithSchema({
            schema: IngestBotFileRequestSchema,
            data: body,
        });

        const scopes = await reachableScopes({ user_id: user.id, file_id });

        const file = await grabBotFile({ scopes, file_id });

        if (!file?.id) throw new AppError(`That file isn't here.`);

        await enqueueFileIngest({ file_id: file.id });

        return { success: true, msg: `${file.name || "The file"} will be read again shortly.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

/**
 * The directories the user reaches for this file.
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
