import { useState, type ReactNode } from "react";
import Link from "@moduletrace/twui/layout/Link";
import isPlainClick from "@/src/utils/is-plain-click";
import FilePreviewModal from "./file-preview-modal";

type Props = {
    name: string;
    url: string;
    media_type?: string | null;
    size?: number;
    title?: string;
    className?: string;
    children: ReactNode;
};

/**
 * A link to a file that opens it in the preview (`FilePreviewModal`) on a
 * plain click. It stays a real link to the bytes, so a middle click or
 * Ctrl/Cmd click still opens the file in a new tab.
 */
export default function FilePreviewLink({ name, url, media_type, size, title, className, children }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={title || `Preview ${name}`}
                onClick={(event) => {
                    if (!isPlainClick({ event })) return;

                    event.preventDefault();
                    setOpen(true);
                }}
                className={className}
            >
                {children}
            </Link>
            {open ? (
                <FilePreviewModal
                    name={name}
                    url={url}
                    media_type={media_type}
                    size={size}
                    onClose={() => setOpen(false)}
                />
            ) : null}
        </>
    );
}
