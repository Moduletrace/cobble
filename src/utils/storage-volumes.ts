/**
 * The folders on the app's data volume (`DATA_DIR`) the files browser at
 * `/admin/files` can open, one volume per kind of owner: a bot's own
 * folder, a workspace's shared one, a computer's home, the media library,
 * an MCP server's install folder, and the database.
 *
 * Client-safe: no `node:path` here, so a chip in a message can build the
 * same link the page reads.
 */
export const StorageVolumeDefs = [
    {
        value: "bots",
        title: "Bots",
        /**
         * How a folder ref names it (`[folder:bot:3:reports]`).
         */
        ref: "bot",
        owner_kind: "bot",
    },
    {
        value: "workspaces",
        title: "Workspaces",
        ref: "workspace",
        owner_kind: "workspace",
    },
    {
        value: "computers",
        title: "Computers",
        ref: "computer",
        owner_kind: "computer",
    },
    {
        value: "media",
        title: "Media",
        ref: "media",
        owner_kind: "user",
    },
    {
        value: "mcp",
        title: "MCP servers",
        ref: "mcp",
        owner_kind: "mcp",
    },
    {
        value: "db",
        title: "Database",
        ref: "db",
        owner_kind: "none",
    },
] as const;

export const StorageVolumes = StorageVolumeDefs.map((def) => def.value);

export type StorageVolume = (typeof StorageVolumeDefs)[number]["value"];

export type StorageOwnerKind = (typeof StorageVolumeDefs)[number]["owner_kind"];

/**
 * One browsable folder: its volume and who owns it (a bot id, workspace
 * id, computer id, user id or MCP server id; 0 for the database).
 */
export type StorageSpec = {
    volume: StorageVolume;
    owner_id: number;
};

/**
 * Where the files browser lands when it has no folder asked for.
 */
export const StorageBrowserPath = "/admin/files";

/**
 * A volume's definition, or undefined for an unknown one.
 */
export function storageVolumeDef({ volume }: { volume?: string | null }) {
    return StorageVolumeDefs.find((def): def is (typeof StorageVolumeDefs)[number] => def.value == volume);
}

/**
 * Whether `volume` is one of `StorageVolumes`.
 */
export function isStorageVolume(volume?: string | null): volume is StorageVolume {
    return Boolean(storageVolumeDef({ volume }));
}

/**
 * The volume a folder ref names (`bot`, `computer`, ...), or null.
 */
export function storageVolumeFromRef({ name }: { name?: string | null }): StorageVolume | null {
    const def = StorageVolumeDefs.find((it) => it.ref == name);

    return def ? def.value : null;
}

/**
 * Whether that volume's folder needs an owner id (everything but the
 * database).
 */
export function storageVolumeNeedsOwner({ volume }: { volume: StorageVolume }) {
    return storageVolumeDef({ volume })?.owner_kind != "none";
}

/**
 * A volume's title, for the picker and a chip's tooltip.
 */
export function storageVolumeLabel({ volume }: { volume: StorageVolume }) {
    return storageVolumeDef({ volume })?.title || volume;
}

/**
 * Reads a volume and owner from an untrusted source (a query string, a
 * ref, a request body): null when either is wrong, so a bad id never
 * becomes a path.
 */
export function parseStorageSpec({
    volume,
    owner_id,
}: {
    volume?: string | null;
    owner_id?: number | string | null;
}): StorageSpec | null {
    if (!isStorageVolume(volume)) return null;

    const wanted = storageVolumeNeedsOwner({ volume });
    const owner = Number(owner_id);

    if (!wanted) return { volume, owner_id: 0 };

    if (!Number.isFinite(owner) || owner <= 0) return null;

    return { volume, owner_id: Math.trunc(owner) };
}

/**
 * Whether two folders are the same one.
 */
export function isSameStorageSpec({ a, b }: { a?: StorageSpec | null; b?: StorageSpec | null }) {
    return Boolean(a && b && a.volume == b.volume && a.owner_id == b.owner_id);
}

/**
 * The files browser's address for a folder and, optionally, a path inside
 * it. What a chip links to, and what the page's breadcrumb builds.
 */
export function storageSpecHref({ spec, path }: { spec: StorageSpec; path?: string | null }) {
    const query = new URLSearchParams({
        volume: spec.volume,
        owner: String(spec.owner_id),
    });
    const clean = (path || "").trim().replace(/^\/+|\/+$/g, "");

    if (clean) query.set("path", clean);

    return `${StorageBrowserPath}?${query.toString()}`;
}

/**
 * A folder's label for a chip: the last path segment, or the volume's
 * title at the top.
 */
export function storagePathName({ volume, path }: { volume: StorageVolume; path?: string | null }) {
    const segments = (path || "").split("/").filter(Boolean);

    return segments.at(-1) || storageVolumeLabel({ volume });
}
