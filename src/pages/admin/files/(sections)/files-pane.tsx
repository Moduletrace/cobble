import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { StorageSpecOption } from "@/src/types";
import { parseStorageSpec, type StorageSpec } from "@/src/utils/storage-volumes";
import useStorageFolder from "../(hooks)/use-storage-folder";
import FilesBrowser from "./files-browser";

/**
 * The files page's state: which folder is open and where inside it, kept
 * in the address so a link to a folder can be shared and the browser's own
 * back button walks back up. The folder asked for comes with the page; a
 * new folder loads through the API.
 */
export default function FilesPane() {
    const { pageProps } = useContext(AppContext);
    const folders = pageProps?.storage_folders || [];
    const page_folder = pageProps?.storage_folder;
    const [spec, set_spec] = useState<StorageSpec | null>(
        parseStorageSpec({ volume: page_folder?.spec.volume, owner_id: page_folder?.spec.owner_id }),
    );
    const [path, set_path] = useState(page_folder?.path || "");
    const [search, set_search] = useState("");
    const [query, set_query] = useState("");
    const { folder, loading, error } = useStorageFolder({
        spec,
        path,
        search: query,
        page_folder,
    });

    const navigate = ({
        next_spec,
        next_path,
    }: {
        next_spec: StorageSpec | null;
        next_path: string;
    }) => {
        set_spec(next_spec);
        set_path(next_path);
        set_search("");
        set_query("");

        const url = new URL(window.location.href);

        if (next_spec) {
            url.searchParams.set("volume", next_spec.volume);
            url.searchParams.set("owner", String(next_spec.owner_id));
        }

        if (next_path) url.searchParams.set("path", next_path);
        else url.searchParams.delete("path");

        history.pushState(null, "", url);
    };

    return (
        <FilesBrowser
            folders={folders}
            folder={folder}
            spec={spec}
            path={path}
            search={search}
            loading={loading}
            error={error}
            onSearch={set_search}
            onSubmitSearch={() => set_query(search)}
            onOpenFolder={(next_path: string) => navigate({ next_spec: spec, next_path })}
            onOpenVolume={(option: StorageSpecOption) =>
                navigate({ next_spec: option.spec, next_path: "" })
            }
        />
    );
}
