import { useState, type ReactNode } from "react";
import Link from "@moduletrace/twui/layout/Link";
import isPlainClick from "@/src/utils/is-plain-click";
import type { StorageSpec } from "@/src/utils/storage-volumes";
import FolderPreviewModal from "./folder-preview-modal";

type Props = {
    spec: StorageSpec;
    path: string;
    /**
     * The folder in the files browser, where a modified click goes.
     */
    href: string;
    title?: string;
    className?: string;
    children: ReactNode;
};

/**
 * A link to a folder that opens it over the page (`FolderPreviewModal`) on
 * a plain click. It stays a real link to the files browser, so a middle
 * click or Ctrl/Cmd click still opens the folder there in a new tab.
 */
export default function FolderPreviewLink({ spec, path, href, title, className, children }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Link
                href={href}
                title={title}
                onClick={(event) => {
                    if (!isPlainClick({ event })) return;

                    event.preventDefault();
                    setOpen(true);
                }}
                className={className}
            >
                {children}
            </Link>
            {open ? <FolderPreviewModal spec={spec} path={path} onClose={() => setOpen(false)} /> : null}
        </>
    );
}
