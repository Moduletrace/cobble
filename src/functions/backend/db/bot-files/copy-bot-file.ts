import mediaFilePath from "@/src/utils/media-file-path";
import AppError from "@/src/utils/app-error";
import type { StorageScope } from "@/src/utils/storage-access";
import { canReachScope } from "@/src/utils/storage-access";
import grabBotFile from "./grab-bot-file";
import recordBotFile from "./record-bot-file";

type Params = {
    scopes: StorageScope[];
    file_id: number | string;
    /**
     * The bot making the copy (it owns the new row).
     */
    bot_id: number | string;
    /**
     * Where the copy goes: one of the run's directories.
     */
    scope: StorageScope;
    /**
     * Its path there. Defaults to the source's path.
     */
    path?: string | null;
    user_id?: number | string;
};

/**
 * Copies a file into another of the run's directories (the coordinator
 * publishing a worker's artifact into its own, or into a workspace). The
 * bytes are copied, so deleting one leaves the other.
 */
export default async function copyBotFile({
    scopes,
    file_id,
    bot_id,
    scope,
    path,
    user_id,
}: Params) {
    if (!canReachScope({ scopes, scope: scope.scope, owner_id: scope.owner_id })) {
        throw new AppError(`You can't write to that folder.`);
    }

    const file = await grabBotFile({ scopes, file_id });

    const absolute = mediaFilePath({ write_path: file?.media?.media_write_path });

    if (!file?.id || !absolute) {
        throw new AppError(`That file isn't in your files.`);
    }

    const source = await Bun.file(absolute).arrayBuffer();

    return await recordBotFile({
        bot_id,
        scope: scope.scope,
        owner_id: scope.owner_id,
        path: path || file.path || file.name || `copy-${file.id}`,
        data: new Uint8Array(source),
        purpose: (file.purpose as any) || "writing",
        source: "tool",
        media_type: (file.media_type as any) || undefined,
        mime_type: file.mime_type || undefined,
        user_id,
    });
}
