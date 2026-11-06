import Span from "@moduletrace/twui/layout/Span";
import { FolderOpen } from "lucide-react";
import FolderPreviewLink from "@/src/components/general/folder-preview-link";
import { folderRefUrl } from "@/src/utils/folder-ref";
import { storagePathName, type StorageSpec } from "@/src/utils/storage-volumes";

type Props = {
    spec: StorageSpec;
    path: string;
};

/**
 * A folder a bot named in a message (`folderRef`): the name it ends with,
 * opening the folder over the chat (`FolderPreviewModal`), where each file
 * opens in its own preview. It stays a link to the same folder in the
 * files browser, for a middle or Ctrl/Cmd click and the modal's "Open in
 * Files". Nothing is downloaded: a folder ref never serves bytes, and this
 * chip never guesses from the name whether it is a file or a folder,
 * because the ref itself already says it is a folder. A file the bot saved
 * is a file ref (`fileRef`) and opens the file instead.
 *
 * Written without a literal ref in this comment on purpose: Tailwind scans
 * every page and partial, reads a bracketed `name:value` as an
 * arbitrary-property utility, and emits it as a real CSS property (esbuild
 * then warns that `file` is not one).
 */
export default function FolderRefChip({ spec, path }: Props) {
    const name = storagePathName({ volume: spec.volume, path });

    return (
        <FolderPreviewLink
            spec={spec}
            path={path}
            href={folderRefUrl({ volume: spec.volume, owner_id: spec.owner_id, path })}
            title={`Open ${path || name}`}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink hover:opacity-80"
        >
            <FolderOpen size={14} aria-hidden className="shrink-0" />
            <Span className="truncate">{name}</Span>
        </FolderPreviewLink>
    );
}
