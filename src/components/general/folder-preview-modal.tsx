import { useMemo, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { SquareArrowOutUpRight } from "lucide-react";
import useDebouncedValue from "@/src/hooks/use-debounced-value";
import useStorageFolder from "@/src/hooks/use-storage-folder";
import useTopModalEscape from "@/src/hooks/use-top-modal-escape";
import { emptyFolderText, folderSummary } from "@/src/utils/folder-text";
import imagePreviewGallery from "@/src/utils/image-preview-gallery";
import { storagePathName, storageSpecHref, type StorageSpec } from "@/src/utils/storage-volumes";
import FilesBreadcrumbRow from "./files-breadcrumb-row";
import FilesSearchInput from "./files-search-input";
import StorageEntryRow from "./storage-entry-row";

type Props = {
    spec: StorageSpec;
    /**
     * The folder it opens on, inside the volume (empty at the top).
     */
    path: string;
    onClose: () => void;
};

/**
 * A folder over the page, as the files browser shows it: its entries,
 * the trail back up and a search by name. A folder inside opens in place,
 * a file opens in its own preview over this one (an image stepping
 * through the folder's other images), and "Open in Files" goes
 * to the same folder in the files browser. The listing loads through the
 * files browser's API, so the same access rules hold.
 */
export default function FolderPreviewModal({ spec, path: start_path, onClose }: Props) {
    const [path, set_path] = useState(start_path);
    const [search, set_search] = useState("");
    const query = useDebouncedValue({ value: search.trim() });
    const { folder, loading, error } = useStorageFolder({ spec, path, search: query });
    const name = folder?.breadcrumbs.at(-1)?.name || folder?.label || storagePathName({ volume: spec.volume, path });

    const gallery = useMemo(
        () => imagePreviewGallery({ items: (folder?.entries || []).map((entry) => ({ ...entry, url: entry.url || "" })) }),
        [folder],
    );

    useTopModalEscape({ onClose });

    const openFolder = (next_path: string) => {
        set_path(next_path);
        set_search("");
    };

    return (
        <Modal
            open
            setOpen={(next_open) => {
                if (!next_open) onClose();
            }}
            className="max-w-3xl! w-[95vw] h-[85vh] p-0 bg-paper flex flex-col overflow-hidden"
        >
            <Row className="w-full gap-3! flex-nowrap items-center pl-5 pr-14 py-3 border-0 border-b border-solid border-hairline">
                <Stack className="min-w-0 grow gap-0! items-start">
                    <H2
                        title={path || name}
                        className="text-base! leading-6! tracking-normal! font-bold text-ink truncate w-full"
                    >
                        {name}
                    </H2>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {folderSummary({ folder })}
                    </Span>
                </Stack>
                <Link
                    href={storageSpecHref({ spec, path })}
                    title="Open this folder in Files"
                    className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1.5 text-[13px] leading-[18px] text-ink-secondary hover:text-ink rounded-default hover:bg-sunken no-underline"
                >
                    <SquareArrowOutUpRight size={16} aria-hidden />
                    <Span className="hidden sm:inline">Open in Files</Span>
                </Link>
            </Row>
            <Stack className="w-full gap-0! items-stretch px-5">
                <FilesBreadcrumbRow crumbs={folder?.breadcrumbs || []} onOpenFolder={openFolder} />
                <FilesSearchInput value={search} onChange={set_search} />
            </Stack>
            <Stack className="grow min-h-0 w-full mt-2 gap-0! items-stretch overflow-y-auto px-5 pb-4">
                {folder?.entries.length ? (
                    folder.entries.map((entry) => (
                        <StorageEntryRow
                            key={entry.path}
                            entry={entry}
                            selected={entry.kind == "folder" && entry.path == path}
                            gallery={gallery}
                            onOpenFolder={openFolder}
                        />
                    ))
                ) : (
                    <Span className="py-8 text-[13px] leading-[18px] text-ink-secondary">
                        {emptyFolderText({ folder, search, loading, error })}
                    </Span>
                )}
            </Stack>
        </Modal>
    );
}
