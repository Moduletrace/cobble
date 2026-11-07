import { statSync } from "node:fs";
import mediaFilePath from "@/src/utils/media-file-path";

type Params = {
    /**
     * A `media` row's `media_write_path`, relative to the data directory.
     */
    write_path?: string | null;
};

/**
 * Where a media row's file sits on the data volume and how big it is, for
 * the file preview. Nothing for a row whose path is unsafe or whose file
 * is gone.
 */
export default function mediaFilePlace({ write_path }: Params): { full_path?: string; size?: number } {
    const absolute = mediaFilePath({ write_path });

    if (!absolute || !write_path) return {};

    try {
        const stats = statSync(absolute);

        if (!stats.isFile()) return {};

        return { full_path: write_path.replace(/^\/+/, ""), size: stats.size };
    } catch {
        return {};
    }
}
