import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { FolderOpen, Paperclip } from "lucide-react";
import { pathRefUrl } from "@/src/utils/path-ref";
import { storagePathName, type StorageSpec } from "@/src/utils/storage-volumes";

type Props = {
    spec: StorageSpec;
    path: string;
};

/**
 * A folder or file a bot named in a message (`pathRef`): the name it ends
 * with, linked into the files browser, where the user can look at
 * everything around it. That is how evidence a bot left on a computer is
 * reached without copying it into its own files first.
 */
export default function PathRefChip({ spec, path }: Props) {
    const name = storagePathName({ volume: spec.volume, path });
    const is_folder = !/\.[a-z0-9]{1,8}$/i.test(name);

    return (
        <Link
            href={pathRefUrl({ volume: spec.volume, owner_id: spec.owner_id, path })}
            title={`Open ${path || name} in Files`}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink hover:opacity-80"
        >
            {is_folder ? (
                <FolderOpen size={14} aria-hidden className="shrink-0" />
            ) : (
                <Paperclip size={14} aria-hidden className="shrink-0" />
            )}
            <Span className="truncate">{name}</Span>
        </Link>
    );
}
