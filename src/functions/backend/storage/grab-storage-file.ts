import { statSync } from "node:fs";
import path from "node:path";
import { AppData } from "@/src/data/app-data";
import { mimeTypeForFile } from "../db/bot-files/media-type-for-file";
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

export type StorageFile = {
    /**
     * The absolute path on disk, inside the volume.
     */
    absolute: string;
    /**
     * Its path inside the volume, e.g. `seo/coderank/raw/crawl.json`.
     */
    relative: string;
    name: string;
    size: number;
    mime_type: string;
    modified_at: number;
};

/**
 * One file for the browser to open: checked to be inside the volume (the
 * same rules a bot's own path gets), to exist, and to be a regular file
 * rather than a folder, and one the user may see in a computer's workspace
 * (`canSeePath`). Null when it isn't one, so a caller can answer
 * "not found" without leaking what is there.
 */
export default function grabStorageFile({ resolved, path: requested }: Params): StorageFile | null {
    const resolved_path = resolveStoragePath({ root: resolved.root, path: requested });

    if (!resolved_path.name) return null;

    if (!canSeePath({ resolved, path: resolved_path.relative })) return null;

    let stats;

    try {
        stats = statSync(resolved_path.absolute);
    } catch {
        return null;
    }

    if (!stats.isFile()) return null;

    if (stats.size > AppData.StorageBrowserReadMaxBytes) return null;

    return {
        absolute: resolved_path.absolute,
        relative: resolved_path.relative,
        name: path.basename(resolved_path.absolute),
        size: stats.size,
        mime_type: mimeTypeForFile({ name: resolved_path.name }),
        modified_at: Math.round(stats.mtimeMs),
    };
}
