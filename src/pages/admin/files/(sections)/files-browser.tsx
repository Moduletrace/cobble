import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { StorageFolderPayload, StorageSpecOption } from "@/src/types";
import type { StorageSpec } from "@/src/utils/storage-volumes";
import { emptyFolderText, folderSummary } from "../(functions)/folder-text";
import FilesBreadcrumbRow from "../(partials)/files-breadcrumb-row";
import FilesSearchInput from "../(partials)/files-search-input";
import FilesVolumeRow from "../(partials)/files-volume-row";
import StorageEntryRow from "../(partials)/storage-entry-row";
import Divider from "@moduletrace/twui/layout/Divider";
import Paper from "@moduletrace/twui/elements/Paper";

type Props = {
    folders: StorageSpecOption[];
    folder: StorageFolderPayload | null;
    spec: StorageSpec | null;
    path: string;
    search: string;
    loading?: boolean;
    error?: string;
    onSearch: (search: string) => void;
    onSubmitSearch: () => void;
    onOpenFolder: (path: string) => void;
    onOpenVolume: (option: StorageSpecOption) => void;
};

/**
 * The files browser: the folders the user reaches on the left, the open
 * folder's entries on the right. Read-only: a bot changes its own files
 * with its tools, and the chat's files modal can delete them.
 */
export default function FilesBrowser({
    folders,
    folder,
    spec,
    path,
    search,
    loading,
    error,
    onSearch,
    onSubmitSearch,
    onOpenFolder,
    onOpenVolume,
}: Props) {
    return (
        <Row className="w-full mt-6 gap-6! flex-wrap items-start lg:flex-nowrap">
            <Stack className="w-full lg:w-[180px] shrink-0 items-stretch">
                <H2 className="mb-2 text-[18px]! leading-6 font-bold tracking-normal text-ink">
                    Folders
                </H2>
                <Divider />
                <Stack className="gap-0! items-stretch">
                    {folders.length ? (
                        folders.map((option) => (
                            <FilesVolumeRow
                                key={`${option.spec.volume}-${option.spec.owner_id}`}
                                option={option}
                                selected={
                                    spec?.volume == option.spec.volume &&
                                    spec?.owner_id == option.spec.owner_id
                                }
                                onOpen={() => onOpenVolume(option)}
                            />
                        ))
                    ) : (
                        <Span className="py-4 text-[13px] leading-[18px] text-ink-secondary">
                            Nothing to show yet: give a bot a file, or let one
                            work on a computer.
                        </Span>
                    )}
                </Stack>
            </Stack>

            <Paper className="w-full xl:p-8 grow h-full">
                <Stack className="grow min-w-0 w-full items-stretch">
                    <Stack className="gap-1! items-stretch">
                        <H2 className="text-[18px]! leading-6 font-bold tracking-normal text-ink">
                            {folder?.breadcrumbs.at(-1)?.name ||
                                folder?.label ||
                                "Files"}
                        </H2>
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">
                            {folderSummary({ folder })}
                        </Span>
                    </Stack>
                    <FilesBreadcrumbRow
                        crumbs={folder?.breadcrumbs || []}
                        onOpenFolder={onOpenFolder}
                    />
                    <FilesSearchInput
                        value={search}
                        loading={loading}
                        onChange={onSearch}
                        onSubmit={onSubmitSearch}
                    />
                    <Stack className="w-full mt-2 gap-0! items-stretch">
                        {folder?.entries.length ? (
                            folder.entries.map((entry) => (
                                <StorageEntryRow
                                    key={entry.path}
                                    entry={entry}
                                    selected={
                                        entry.kind == "folder" &&
                                        entry.path == path
                                    }
                                    onOpenFolder={onOpenFolder}
                                />
                            ))
                        ) : (
                            <Span className="py-8 text-[13px] leading-[18px] text-ink-secondary">
                                {emptyFolderText({ folder, search, loading, error })}
                            </Span>
                        )}
                    </Stack>
                </Stack>
            </Paper>
        </Row>
    );
}
