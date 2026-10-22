/**
 * Where a bot names a folder or file on the app's data volume in a
 * message: `[path:computer:3:seo/coderank/raw]`. The chat turns it into a
 * chip that opens it in the files browser (`/admin/files`), which is how a
 * bot points the user at something it left on a computer (raw evidence,
 * a crawl, a report it never copied) without importing it first.
 */
import { StorageBrowserPath, storageSpecHref, storageVolumeFromRef, type StorageSpec } from "./storage-volumes";

/**
 * The link target a path ref becomes, e.g. `#path-computer%3A3%3Aseo%2Fraw`.
 */
export const PathRefHrefPrefix = "#path-";

type RefParams = {
    /**
     * The volume by the name a ref uses: `bot`, `workspace`, `computer`,
     * `media`, `mcp` or `db`.
     */
    volume: string;
    owner_id: number | string;
    path?: string | null;
};

/**
 * How a bot names a folder or file in a message. The path is written as it
 * is; the chat encodes it into the link.
 */
export default function pathRef({ volume, owner_id, path }: RefParams) {
    const clean = (path || "").trim().replace(/^\/+|\/+$/g, "");

    return clean
        ? `[path:${volume}:${owner_id}:${clean}]`
        : `[path:${volume}:${owner_id}]`;
}

/**
 * The href a path ref becomes: everything after `#path-`, URI encoded, so
 * spaces, `#` and `:` in a path survive markdown.
 */
export function pathRefHref({ volume, owner_id, path }: RefParams) {
    const clean = (path || "").trim().replace(/^\/+|\/+$/g, "");

    return `${PathRefHrefPrefix}${encodeURIComponent(
        clean ? `${volume}:${owner_id}:${clean}` : `${volume}:${owner_id}`,
    )}`;
}

/**
 * Reads a path ref's link back into a folder and a path inside it, or null
 * when it names a volume that isn't one (or has no owner).
 */
export function parsePathRefHref({
    href,
}: {
    href?: string | null;
}): { spec: StorageSpec; path: string } | null {
    if (!href?.startsWith(PathRefHrefPrefix)) return null;

    const decoded = decodeURIComponent(href.slice(PathRefHrefPrefix.length));
    const [name, raw_owner, ...rest] = decoded.split(":");
    const volume = storageVolumeFromRef({ name });
    const owner_id = Number(raw_owner);

    if (!volume) return null;

    if (!Number.isFinite(owner_id) || owner_id < 0) return null;

    return {
        spec: { volume, owner_id: Math.trunc(owner_id) },
        path: rest.join("/").replace(/^\/+|\/+$/g, ""),
    };
}

/**
 * Where a path ref opens: the files browser, on that folder. A volume the
 * browser doesn't know lands on its first folder.
 */
export function pathRefUrl({ volume, owner_id, path }: RefParams) {
    const known = storageVolumeFromRef({ name: volume });

    if (!known) return StorageBrowserPath;

    return storageSpecHref({ spec: { volume: known, owner_id: Number(owner_id) }, path });
}
