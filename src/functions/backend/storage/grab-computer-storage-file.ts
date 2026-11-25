import { AppData } from "@/src/data/app-data";
import downloadComputerFile from "@/src/functions/backend/computers/download-computer-file";
import { mimeTypeForFile } from "@/src/functions/backend/db/bot-files/media-type-for-file";
import grabComputerTarget from "@/src/functions/backend/db/computers/grab-computer-target";
import { canSeePath } from "./list-storage-entries";
import resolveStoragePath from "./resolve-storage-path";
import type { ResolvedStorageSpec } from "./resolve-storage-spec";

type Params = {
    resolved: ResolvedStorageSpec;
    /**
     * The file to open, relative to the volume's root.
     */
    path?: string | null;
};

export type ComputerStorageFile = {
    bytes: Buffer;
    name: string;
    size: number;
    mime_type: string;
};

/**
 * One file of a computer's workspace, streamed from its agent when the app
 * itself can't read the folder (a dev server running as a plain user can't
 * read a worker's folder). The same path rules and the same access check as
 * the file on this machine (`grabStorageFile`), and the same size limit.
 * Null when it isn't a file there, or the computer can't be reached.
 */
export default async function grabComputerStorageFile({
    resolved,
    path: requested,
}: Params): Promise<ComputerStorageFile | null> {
    if (resolved.spec.volume != "computers") return null;

    const resolved_path = resolveStoragePath({ root: resolved.root, path: requested });

    if (!resolved_path.name) return null;

    if (!canSeePath({ resolved, path: resolved_path.relative })) return null;

    const target = await grabComputerTarget({ computer_id: resolved.spec.owner_id });

    if (!target?.ready || target.connection != "docker") return null;

    const file = `${AppData.ComputerWorkspaceDir}/${resolved_path.relative}`;
    const download = await downloadComputerFile({
        computer: target,
        path: file,
        max_bytes: AppData.StorageBrowserReadMaxBytes,
    });

    if (!download.ok) return null;

    return {
        bytes: download.bytes,
        name: resolved_path.name,
        size: download.size,
        mime_type: mimeTypeForFile({ name: resolved_path.name }),
    };
}