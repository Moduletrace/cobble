import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { FolderOpen } from "lucide-react";
import { folderRefUrl } from "@/src/utils/folder-ref";
import { storagePathName, type StorageSpec } from "@/src/utils/storage-volumes";

type Props = {
    spec: StorageSpec;
    path: string;
};

/**
 * A folder a bot named in a message (`folderRef`): the name it ends with,
 * linked into the files browser, where the user can look at everything in
 * it. Nothing is downloaded: a folder ref never serves bytes, and this chip
 * never guesses from the name whether it is a file or a folder, because the
 * ref itself already says it is a folder. A file the bot saved is a file
 * ref (`fileRef`) and opens the file instead.
 *
 * Written without a literal ref in this comment on purpose: Tailwind scans
 * every page and partial, reads a bracketed `name:value` as an
 * arbitrary-property utility, and emits it as a real CSS property (esbuild
 * then warns that `file` is not one).
 */
export default function FolderRefChip({ spec, path }: Props) {
    const name = storagePathName({ volume: spec.volume, path });

    return (
        <Link
            href={folderRefUrl({ volume: spec.volume, owner_id: spec.owner_id, path })}
            title={`Open ${path || name} in Files`}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink hover:opacity-80"
        >
            <FolderOpen size={14} aria-hidden className="shrink-0" />
            <Span className="truncate">{name}</Span>
        </Link>
    );
}
