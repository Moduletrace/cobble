/**
 * How a bot names a folder on the app's data volume in a message:
 * `[folder:bot:3:reports]`, `[folder:computer:3:seo/coderank/raw]`,
 * `[folder:workspace:2]`.
 *
 * A folder ref is always a folder: the chat turns it into a chip that opens
 * the files browser (`/admin/files`) at that folder, and nothing is
 * downloaded. A file the bot saved is named with a `[file:ID]` ref instead
 * (`fileRef`), which is what downloads. There is no guessing from the
 * name's extension: the ref says which one it is.
 */
import {
    isStorageVolume,
    parseStorageSpec,
    StorageBrowserPath,
    storageSpecHref,
    storageVolumeFromRef,
    type StorageSpec,
} from "./storage-volumes";

/**
 * The link target a folder ref becomes, e.g.
 * `#folder-bot%3A3%3Areports`.
 */
export const FolderRefHrefPrefix = "#folder-";

type RefParams = {
    /**
     * The volume by the name a ref uses: `bot`, `workspace`, `computer`,
     * `media`, `mcp` or `db`.
     */
    volume: string;
    owner_id: number | string;
    path?: string | null;
};

function cleanPath({ path }: { path?: string | null }) {
    return (path || "").trim().replace(/^\/+|\/+$/g, "");
}

/**
 * How a bot names a folder in a message. The path is written as it is; the
 * chat encodes it into the link.
 */
export default function folderRef({ volume, owner_id, path }: RefParams) {
    const clean = cleanPath({ path });

    return clean
        ? `[folder:${volume}:${owner_id}:${clean}]`
        : `[folder:${volume}:${owner_id}]`;
}

/**
 * The href a folder ref becomes: everything after `#folder-`, URI encoded,
 * so spaces, `#` and `:` in a path survive markdown.
 */
export function folderRefHref({ volume, owner_id, path }: RefParams) {
    const clean = cleanPath({ path });

    return `${FolderRefHrefPrefix}${encodeURIComponent(
        clean ? `${volume}:${owner_id}:${clean}` : `${volume}:${owner_id}`,
    )}`;
}

/**
 * Reads a folder ref's link back into a folder and a path inside it, or
 * null when it names a volume that isn't one (or has no owner).
 */
export function parseFolderRefHref({
    href,
}: {
    href?: string | null;
}): { spec: StorageSpec; path: string } | null {
    if (!href?.startsWith(FolderRefHrefPrefix)) return null;

    let decoded = "";

    try {
        decoded = decodeURIComponent(href.slice(FolderRefHrefPrefix.length));
    } catch {
        return null;
    }

    const [name, raw_owner, ...rest] = decoded.split(":");
    const volume = storageVolumeFromRef({ name });
    const owner_id = Number(raw_owner);

    if (!volume) return null;

    if (!Number.isFinite(owner_id) || owner_id < 0) return null;

    return {
        spec: { volume, owner_id: Math.trunc(owner_id) },
        path: rest.join(":").replace(/^\/+|\/+$/g, ""),
    };
}

/**
 * Where a folder ref opens: the files browser, on that folder. A volume the
 * browser doesn't know lands on its first folder.
 *
 * Both spellings of a volume come through here: a ref names it the way a
 * bot writes it (`computer`), the files browser the way it stores it
 * (`computers`). Either one resolves, so a chip never loses its folder and
 * drops back to the files browser's first folder.
 */
export function folderRefUrl({ volume, owner_id, path }: RefParams) {
    const from_ref = storageVolumeFromRef({ name: volume });
    const known = from_ref || (isStorageVolume(volume) ? volume : null);

    if (!known) return StorageBrowserPath;

    const spec = parseStorageSpec({ volume: known, owner_id });

    if (!spec) return StorageBrowserPath;

    return storageSpecHref({ spec, path });
}
