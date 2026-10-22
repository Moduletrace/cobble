import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import { FolderOpen } from "lucide-react";
import type { MediaType, StorageEntry } from "@/src/types";
import formatBytes from "@/src/utils/format-bytes";
import relativeTime from "@/src/utils/relative-time";
import AttachmentIcon from "@/src/pages/admin/bots/[bot_id]/(partials)/attachment-icon";

type Props = {
    entry: StorageEntry;
    selected?: boolean;
    onOpenFolder: (path: string) => void;
};

/**
 * One entry in the open folder: a folder opens in place, a file opens in a
 * new tab (its own media record when it is one of the bot's files, else
 * the browser's streaming route).
 */
export default function StorageEntryRow({ entry, selected, onOpenFolder }: Props) {
    const is_folder = entry.kind == "folder";

    return (
        <Row
            className={twMerge(
                "w-full gap-3! flex-nowrap items-start py-2 border-0 border-b border-solid border-hairline last:border-b-0",
                selected && "bg-ink/5",
            )}
        >
            <Row className="mt-0.5 text-ink-secondary">
                {is_folder ? (
                    <FolderOpen size={16} aria-hidden className="shrink-0" />
                ) : (
                    <AttachmentIcon media_type={entry.media_type as MediaType} size={16} />
                )}
            </Row>
            <Stack className="min-w-0 flex-1 gap-0.5!">
                {is_folder ? (
                    <Link
                        href={entry.url || "/admin/files"}
                        title={`Open ${entry.name}`}
                        onClick={(event) => {
                            event.preventDefault();
                            onOpenFolder(entry.path);
                        }}
                        className="text-[13px] font-bold leading-5 text-ink break-words hover:opacity-80"
                    >
                        {entry.name}
                    </Link>
                ) : (
                    <Link
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${entry.name}`}
                        className="text-[13px] font-bold leading-5 text-ink break-words hover:opacity-80"
                    >
                        {entry.name}
                    </Link>
                )}
                <Span className="text-[12px] leading-4 text-ink-secondary">
                    {[
                        is_folder ? "Folder" : formatBytes({ bytes: entry.size }),
                        entry.modified_at ? relativeTime({ at: entry.modified_at }) : "",
                        entry.file_id ? "Saved by the bot" : "",
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </Span>
            </Stack>
        </Row>
    );
}
