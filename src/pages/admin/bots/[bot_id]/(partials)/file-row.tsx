import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Button from "@moduletrace/twui/layout/Button";
import { RefreshCw, Trash2 } from "lucide-react";
import type { MediaType, PublicBotFile } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";
import AttachmentIcon from "./attachment-icon";

type Props = {
    file: PublicBotFile;
    /**
     * A crew manager may delete and re-ingest.
     */
    can_manage: boolean;
    busy?: boolean;
    onIngest: () => void;
    onDelete: () => void;
};

/**
 * One file in the files modal: its type, path, size and age, and what can
 * be done with it. A file that isn't searchable says why.
 */
export default function FileRow({ file, can_manage, busy, onIngest, onDelete }: Props) {
    return (
        <Row className="w-full gap-3! flex-nowrap items-start py-2 border-0 border-b border-solid border-hairline last:border-b-0">
            <Row className="mt-0.5 text-ink-secondary">
                <AttachmentIcon media_type={file.media_type as MediaType} size={16} />
            </Row>
            <Stack className="min-w-0 flex-1 gap-0.5!">
                <Link
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${file.name}`}
                    className="text-[13px] font-bold leading-5 text-ink break-words hover:opacity-80"
                >
                    {file.path || file.name}
                </Link>
                <Span className="text-[12px] leading-4 text-ink-secondary">
                    {[
                        file.scope == "workspace" ? "Workspace" : "Bot files",
                        `${Math.max(1, Math.round(file.size / 1024))} KB`,
                        file.created_at ? relativeTime({ at: file.created_at }) : "",
                        file.ingest_error
                            ? file.ingest_error
                            : file.ingested_at
                              ? "searchable"
                              : "not searchable yet",
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </Span>
            </Stack>
            {can_manage ? (
                <Row className="shrink-0 gap-0!">
                    <Button
                        title="Read it again so it can be searched"
                        aria-label="Reingest"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        disabled={busy}
                        onClick={onIngest}
                        className="p-1.5!"
                    >
                        <RefreshCw size={14} aria-hidden />
                    </Button>
                    <Button
                        title="Delete it"
                        aria-label="Delete"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        disabled={busy}
                        onClick={onDelete}
                        className="p-1.5!"
                    >
                        <Trash2 size={14} aria-hidden />
                    </Button>
                </Row>
            ) : null}
        </Row>
    );
}
