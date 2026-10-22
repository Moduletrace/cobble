import Row from "@moduletrace/twui/layout/Row";
import Link from "@moduletrace/twui/layout/Link";
import { FileText, Image as ImageIcon } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import type { TaskFile } from "@/src/types";
import fileRef from "@/src/utils/file-ref";

type Props = {
    file: TaskFile;
    /**
     * A crew manager can unlink it.
     */
    onDetach?: () => void;
    busy?: boolean;
};

/**
 * One file on a task: its name, opening the bytes at `/media/<id>` (private,
 * so only someone who reaches the task can load it), and its file ref (built by `fileRef`) when it
 * lives in a bot's or workspace's folder (so the file's real home is
 * reachable too).
 */
export default function TaskFileRow({ file, onDetach, busy }: Props) {
    if (file.missing) {
        return (
            <Row className="w-full min-h-10 gap-2! flex-nowrap items-center px-1 py-1">
                <FileText size={16} className="shrink-0 text-ink-disabled" aria-hidden />
                <Span className="grow min-w-0 text-[13px] leading-[18px] text-ink-disabled truncate">
                    {file.name || `File ${file.media_id}`} (gone)
                </Span>
            </Row>
        );
    }

    return (
        <Row className="w-full min-h-10 gap-2! flex-nowrap items-center px-1 py-1">
            {file.media_type == "image" ? (
                <ImageIcon size={16} className="shrink-0 text-ink-secondary" aria-hidden />
            ) : (
                <FileText size={16} className="shrink-0 text-ink-secondary" aria-hidden />
            )}
            <Link
                href={`/media/${file.media_id}`}
                target="_blank"
                rel="noreferrer"
                title={file.name || "Open the file"}
                className="grow min-w-0 text-[13px] leading-[18px] text-ink truncate hover:underline"
            >
                {file.name || `File ${file.media_id}`}
            </Link>
            {file.kind == "reference" ? (
                <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">reference</Span>
            ) : null}
            {file.bot_file_id ? (
                <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">
                    {fileRef({ id: file.bot_file_id })}
                </Span>
            ) : null}
            {onDetach ? (
                <Span
                    role="button"
                    tabIndex={0}
                    aria-disabled={busy}
                    title="Unlink this file"
                    onClick={() => (busy ? undefined : onDetach())}
                    onKeyDown={(event) => {
                        if (busy) return;
                        if (event.key == "Enter" || event.key == " ") onDetach();
                    }}
                    className="shrink-0 px-1 text-[11px] leading-4 text-ink-secondary cursor-pointer hover:text-ink"
                >
                    Unlink
                </Span>
            ) : null}
        </Row>
    );
}
