import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import grabBotFileScope from "@/src/functions/backend/db/bot-files/grab-bot-file-scope";
import userReachesFileScope from "@/src/functions/backend/db/bot-files/user-reaches-file-scope";
import grabBotFileQuotaBytes, {
    grabBotFileQuotaMb,
} from "@/src/functions/backend/db/bot-files/grab-bot-file-quota-bytes";
import grabStorageUsage from "@/src/functions/backend/db/bot-files/grab-storage-usage";
import listBotFiles, { listBotFolders } from "@/src/functions/backend/db/bot-files/list-bot-files";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import type { BotFileScopesPayload } from "@/src/types";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { BotFileScope } from "@/src/dict/bot-file-dict";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * A conversation's files: the bot's own, or a workspace's shared ones.
 * `?file_id=` returns one (for a message's file chip), else a folder's
 * files. Only a user who reaches the bot or workspace sees them.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotFileScopesPayload>> = async ({
    req,
}) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const url = new URL(req.url);
        const bot_id = Number(url.searchParams.get("bot_id"));
        const workspace_id = Number(url.searchParams.get("workspace_id"));
        const file_id = Number(url.searchParams.get("file_id"));
        const folder = url.searchParams.get("folder") || "";
        const search = url.searchParams.get("search") || "";

        const scope: { scope: BotFileScope; owner_id: number } | null = workspace_id
            ? (await grabUserWorkspace({ workspace_id, user_id: user.id }))
                ? { scope: "workspace", owner_id: workspace_id }
                : null
            : bot_id
              ? (await grabUserBot({ bot_id, user_id: user.id }))
                  ? { scope: "bot", owner_id: bot_id }
                  : null
              : null;

        if (!scope) {
            return { success: false, msg: `Not found.` };
        }

        const scopes = [scope];

        if (file_id) {
            /**
             * A workspace run saves to the bot's own folder by default
             * (`grabStorageScopes`, own first), so a chip in a workspace
             * conversation looks there too, for a user who reaches that bot
             * (the same reach `grabBotFileMedia` checks before the bytes).
             */
            const file_scopes =
                scope.scope == "workspace" && bot_id && (await grabUserBot({ bot_id, user_id: user.id }))
                    ? [...scopes, { scope: "bot" as const, owner_id: bot_id }]
                    : scopes;
            /**
             * A file from another bot's folder (an answer passed on from a
             * chatroom names the asked bot's file) opens for a user who
             * reaches that folder, as its bytes do (`grabBotFileMedia`).
             */
            let file = await grabBotFile({ scopes: file_scopes, file_id });

            if (!file?.id) {
                const elsewhere = await grabBotFileScope({ file_id });

                if (elsewhere && (await userReachesFileScope({ ...elsewhere, user_id: user.id }))) {
                    file = await grabBotFile({ scopes: [elsewhere], file_id });
                }
            }

            if (!file?.id) return { success: false, msg: `Not found.` };

            return {
                success: true,
                singleRes: {
                    files: [toPublicFile({ file })],
                    folders: [],
                    usage: { bytes: 0, files: 0 },
                    quota_bytes: 0,
                    quota_mb: 0,
                },
            };
        }

        const [files, folders, usage, quota_bytes, quota_mb] = await Promise.all([
            listBotFiles({ scopes, folder, search }),
            listBotFolders({ scopes }),
            grabStorageUsage(scope),
            grabBotFileQuotaBytes(),
            grabBotFileQuotaMb(),
        ]);

        return {
            success: true,
            singleRes: {
                files: files.map((file) => toPublicFile({ file })),
                folders,
                usage,
                quota_bytes,
                quota_mb,
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

function toPublicFile({ file }: { file: BotFileWithMediaLite }) {
    const { media_url } = grabMediaURL({ media: { ...(file.media || {}), id: file.media_id } as any });

    return {
        id: Number(file.id),
        name: file.name || "",
        path: file.path || "",
        size: Number(file.size) || 0,
        media_type: file.media_type || "document",
        purpose: file.purpose || "writing",
        scope: file.scope || "bot",
        owner_id: Number(file.owner_id) || 0,
        ingested_at: file.ingested_at ? Number(file.ingested_at) : undefined,
        ingest_error: file.ingest_error || undefined,
        created_at: Number(file.created_at) || 0,
        url: media_url || "",
    };
}

type BotFileWithMediaLite = {
    id?: number | "";
    media_id?: number | "";
    name?: string;
    path?: string;
    size?: number | "";
    media_type?: string;
    purpose?: string;
    scope?: string;
    owner_id?: number | "";
    ingested_at?: number | "";
    ingest_error?: string;
    created_at?: number | "";
    media?: Record<string, unknown> | null;
};
