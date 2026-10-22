import { existsSync, lstatSync, readdirSync } from "node:fs";
import path from "node:path";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import grabMediaURL from "../media/grab-media-url";
import { isInsideRoot } from "./resolve-storage-path";
import type { ResolvedStorageSpec } from "./resolve-storage-spec";
import {
    storageSpecHref,
    type StorageSpec,
} from "@/src/utils/storage-volumes";

type Params = {
    /**
     * The folder, already access-checked (`resolveStorageSpec`).
     */
    resolved: ResolvedStorageSpec;
    /**
     * The directory to list, already checked (`resolveStoragePath`).
     */
    absolute: string;
    /**
     * The same directory, relative to the volume's root. Empty at the top.
     */
    relative: string;
    /**
     * Match a name or path, case-insensitive. Folders are kept so a match
     * deeper down is still reachable.
     */
    search?: string | null;
    offset?: number;
};

export type StorageEntry = {
    name: string;
    /**
     * Where it is, inside the volume's root, e.g. `seo/coderank/raw`.
     */
    path: string;
    kind: "file" | "folder";
    size: number;
    modified_at: number;
    media_type?: string;
    /**
     * The `bot_files` row, when one of the bot's own files is that path, so
     * it keeps opening through its own media record.
     */
    file_id?: number;
    /**
     * Where to open it: a `bot_files` row's media URL, else the volume
     * browser's own streaming route.
     */
    url?: string;
};

/**
 * One directory on the data volume, for the files browser: its entries
 * (folders first), a page of them, and a `bot_files` row attached to any
 * that has one. Entries a symlink leads out of the volume with are left
 * out, so nothing outside the folder is ever listed.
 */
export default async function listStorageEntries({
    resolved,
    absolute,
    relative,
    search,
    offset = 0,
}: Params) {
    /**
     * A folder nothing has written to yet (a computer's home before it
     * starts, a bot's before its first file) shows as empty rather than as
     * an error.
     */
    if (!existsSync(absolute)) return { entries: [], total: 0, offset };

    const rows = readdirSync(absolute, { withFileTypes: true });
    const indexed = await botFileRows({ resolved, paths: rows.map((row) => joinPath({ relative, name: row.name })) });
    const needle = search?.trim().toLowerCase() || "";
    const entries: StorageEntry[] = [];

    for (const row of rows) {
        if (row.name == ".DS_Store") continue;

        const entry_path = joinPath({ relative, name: row.name });

        if (needle && !entry_path.toLowerCase().includes(needle)) continue;

        const entry_absolute = path.join(absolute, row.name);

        if (!isInsideRoot({ root: resolved.root, absolute: entry_absolute })) continue;

        let stats;

        try {
            stats = lstatSync(entry_absolute);
        } catch {
            continue;
        }

        /**
         * A symlink is not followed: it may lead anywhere, and the
         * volume's own folders are what this lists.
         */
        if (stats.isSymbolicLink()) continue;

        if (stats.isDirectory()) {
            entries.push({
                name: row.name,
                path: entry_path,
                kind: "folder",
                size: 0,
                modified_at: Math.round(stats.mtimeMs),
                url: storageSpecHref({ spec: resolved.spec, path: entry_path }),
            });
            continue;
        }

        if (!stats.isFile()) continue;

        const file = indexed.get(entry_path);
        const { media_url } = file?.media_id
            ? grabMediaURL({ media: { id: file.media_id } as any })
            : {};

        entries.push({
            name: row.name,
            path: entry_path,
            kind: "file",
            size: stats.size,
            modified_at: Math.round(stats.mtimeMs),
            media_type: file?.media_type || undefined,
            file_id: file?.id ? Number(file.id) : undefined,
            url: media_url || fileUrl({ spec: resolved.spec, path: entry_path }),
        });
    }

    entries.sort((a, b) => {
        if (a.kind != b.kind) return a.kind == "folder" ? -1 : 1;

        return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    return {
        entries: entries.slice(offset, offset + AppData.StorageBrowserPageSize),
        total: entries.length,
        offset,
    };
}

/**
 * Where a folder's file opens when it has no `bot_files` row (a computer's
 * home, the media library, an MCP server's install): the browser's own
 * streaming route, which checks the same access again.
 */
export function fileUrl({ spec, path }: { spec: StorageSpec; path: string }) {
    const query = new URLSearchParams({
        volume: spec.volume,
        owner: String(spec.owner_id),
        path,
    });

    return `/api/admin/storage/file?${query.toString()}`;
}

/**
 * The `bot_files` rows behind the paths of one start and workspace folder,
 * keyed by path. Nothing for the other volumes, which have no catalog.
 */
async function botFileRows({
    resolved,
    paths,
}: {
    resolved: ResolvedStorageSpec;
    paths: string[];
}) {
    const rows = new Map<string, BUN_SQLITE_COBBLE_BOT_FILES>();

    if (resolved.spec.volume != "bots" && resolved.spec.volume != "workspaces") return rows;
    if (!paths.length) return rows;

    const scope = resolved.spec.volume == "bots" ? "bot" : "workspace";
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT * FROM bot_files WHERE scope = ? AND owner_id = ? AND path IN (${paths
            .map(() => "?")
            .join(",")})`,
        values: [scope, resolved.spec.owner_id, ...paths],
    });

    for (const row of res.payload || []) {
        if (row.path) rows.set(String(row.path), row);
    }

    return rows;
}

function joinPath({ relative, name }: { relative: string; name: string }) {
    return relative ? `${relative}/${name}` : name;
}

/**
 * The breadcrumb trail of a folder, from the volume's top: one crumb per
 * segment, each with the address that opens it.
 */
export function storageBreadcrumbs({
    spec,
    path: relative,
}: {
    spec: StorageSpec;
    path?: string | null;
}) {
    const segments = (relative || "").split("/").filter(Boolean);
    const crumbs = [{ name: "", href: storageSpecHref({ spec }) }];

    for (let i = 1; i <= segments.length; i++) {
        crumbs.push({
            name: segments[i - 1] || "",
            href: storageSpecHref({ spec, path: segments.slice(0, i).join("/") }),
        });
    }

    return crumbs;
}
