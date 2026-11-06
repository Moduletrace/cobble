import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Download, SquareArrowOutUpRight } from "lucide-react";
import useGalleryKeys from "@/src/hooks/use-gallery-keys";
import usePreloadImages from "@/src/hooks/use-preload-images";
import useTopModalEscape from "@/src/hooks/use-top-modal-escape";
import type { FilePreviewItem } from "@/src/types";
import filePreviewKind from "@/src/utils/file-preview-kind";
import formatBytes from "@/src/utils/format-bytes";
import galleryIndex from "@/src/utils/gallery-index";
import FilePreviewBody from "./file-preview-body";
import FilePreviewStepper from "./file-preview-stepper";

type Props = {
    name: string;
    url: string;
    media_type?: string | null;
    size?: number;
    /**
     * The images it was opened among (a folder's, a message's). When the
     * file is one of them, Previous and Next (and the arrow keys) step
     * through them without closing the preview.
     */
    gallery?: FilePreviewItem[];
    onClose: () => void;
};

const ActionClassName =
    "shrink-0 inline-flex items-center gap-1.5 px-2 py-1.5 text-[13px] leading-[18px] text-ink-secondary hover:text-ink rounded-default hover:bg-sunken no-underline";

/**
 * A file over the page: markdown rendered, a CSV as a table, an image,
 * PDF, audio or video in place, other text as code, with ways to download
 * it or open it in a new tab. A file it can't show offers those only.
 * Opened from a gallery, it steps through its images; each one opens fresh
 * (fitted, scrolled to the top), and its neighbours load ahead.
 */
export default function FilePreviewModal({ gallery, onClose, ...opened }: Props) {
    const [index, set_index] = useState(() => galleryIndex({ gallery, url: opened.url }));
    const stepping = Boolean(gallery && index >= 0 && gallery.length > 1);
    const shown: FilePreviewItem = (stepping && gallery?.[index]) || opened;
    const { name, url, media_type, size } = shown;
    const kind = filePreviewKind({ name, media_type });
    const base_name = name.split("/").pop() || name;
    const count = gallery?.length || 0;
    const step = ({ by }: { by: number }) =>
        set_index((current) => Math.min(count - 1, Math.max(0, current + by)));

    useTopModalEscape({ onClose });
    useGalleryKeys({
        enabled: stepping,
        onPrevious: () => step({ by: -1 }),
        onNext: () => step({ by: 1 }),
    });
    usePreloadImages({
        urls: stepping ? [gallery?.[index + 1]?.url || "", gallery?.[index - 1]?.url || ""] : [],
    });

    return (
        <Modal
            open
            setOpen={(next_open) => {
                if (!next_open) onClose();
            }}
            className="max-w-[95vw]! w-[95vw] h-[90vh] p-0 bg-paper flex flex-col overflow-hidden"
        >
            <Row className="w-full gap-3! flex-nowrap items-center pl-5 pr-14 py-3 border-0 border-b border-solid border-hairline">
                <Stack className="min-w-0 grow gap-0! items-start">
                    <H2
                        title={name}
                        className="text-base! leading-6! tracking-normal! font-bold text-ink truncate w-full"
                    >
                        {base_name}
                    </H2>
                    {size ? (
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">
                            {formatBytes({ bytes: size })}
                        </Span>
                    ) : null}
                </Stack>
                {stepping ? (
                    <FilePreviewStepper
                        index={index}
                        count={count}
                        onPrevious={() => step({ by: -1 })}
                        onNext={() => step({ by: 1 })}
                    />
                ) : null}
                <Link
                    href={url}
                    download={base_name}
                    title={`Download ${base_name}`}
                    className={ActionClassName}
                >
                    <Download size={16} aria-hidden />
                    <Span className="hidden sm:inline">Download</Span>
                </Link>
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in a new tab"
                    aria-label="Open in a new tab"
                    className={ActionClassName}
                >
                    <SquareArrowOutUpRight size={16} aria-hidden />
                </Link>
            </Row>
            <FilePreviewBody
                key={url}
                kind={kind}
                name={base_name}
                url={url}
                size={size}
            />
        </Modal>
    );
}
