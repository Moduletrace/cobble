import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { StorageFolderPayload } from "@/src/types";

type Params = {
    spec: { volume: string; owner_id: number } | null;
    /**
     * The folder's path inside the volume; empty at the top.
     */
    path: string;
    /**
     * The search the user submitted (not what is typed).
     */
    search?: string;
    /**
     * The folder the page already carries, when this is that one.
     */
    page_folder?: StorageFolderPayload | null;
};

/**
 * One folder of the files browser. The page's own copy is used when it is
 * the folder asked for and nothing is searched; anything else loads from
 * the API, so a page never carries the whole volume.
 *
 * A loaded folder is only ever handed back for the volume and path it
 * belongs to: opening another folder shows its own name and a loading
 * line, never the previous folder's entries (which would still be
 * clickable, and open the folder the user just left).
 */
export default function useStorageFolder({ spec, path, search, page_folder }: Params) {
    const from_page = Boolean(
        page_folder &&
            spec &&
            page_folder.spec.volume == spec.volume &&
            page_folder.spec.owner_id == spec.owner_id &&
            page_folder.path == path &&
            !search,
    );
    const request_key = folderKey({ spec, path });
    const [loaded, set_loaded] = useState<{ key: string; folder: StorageFolderPayload | null } | null>(
        from_page && page_folder ? { key: request_key, folder: page_folder } : null,
    );
    const [loading, set_loading] = useState(!from_page && Boolean(spec));
    const [error, set_error] = useState<string>();

    useEffect(() => {
        if (!spec) {
            set_loaded(null);
            set_loading(false);
            return;
        }

        if (from_page) {
            set_loaded({ key: request_key, folder: page_folder || null });
            set_loading(false);
            set_error(undefined);
            return;
        }

        const controller = new AbortController();

        const load = async () => {
            set_loading(true);
            set_error(undefined);

            const query = new URLSearchParams({
                volume: spec.volume,
                owner: String(spec.owner_id),
            });

            if (path) query.set("path", path);
            if (search) query.set("search", search);

            const res = await fetchApi<{}, APIResponseObject<StorageFolderPayload>>(
                `/api/admin/storage/list?${query.toString()}`,
                { method: "GET" },
            ).catch(() => null);

            if (controller.signal.aborted) return;

            set_loading(false);

            if (!res?.success || !res.singleRes) {
                set_loaded({ key: request_key, folder: null });
                set_error(res?.msg || `Couldn't open that folder.`);
                return;
            }

            set_loaded({ key: request_key, folder: res.singleRes });
        };

        load().catch(() => {});

        return () => controller.abort();
    }, [spec?.volume, spec?.owner_id, path, search, from_page, page_folder]);

    const folder = loaded?.key == request_key ? loaded.folder : null;
    const pending = Boolean(spec) && loaded?.key != request_key;

    return { folder, loading: loading || pending, error };
}

/**
 * What a loaded folder belongs to: its volume, its owner and its path. A
 * search is left out, since filtered entries are still that folder's.
 */
function folderKey({ spec, path }: { spec: Params["spec"]; path: string }) {
    return `${spec?.volume || ""}:${spec?.owner_id ?? ""}:${path}`;
}