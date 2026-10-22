import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { StorageSpecOption } from "@/src/types";
import { storageSpecHref, storageVolumeLabel } from "@/src/utils/storage-volumes";

type Props = {
    option: StorageSpecOption;
    selected: boolean;
    onOpen: () => void;
};

/**
 * One folder in the files browser's picker: the bot, workspace, computer,
 * media library, MCP server or database it is, named the way the crew
 * names it.
 */
export default function FilesVolumeRow({ option, selected, onOpen }: Props) {
    return (
        <Link
            href={storageSpecHref({ spec: option.spec })}
            title={`${storageVolumeLabel({ volume: option.spec.volume })}: ${option.label}`}
            aria-current={selected ? "page" : undefined}
            onClick={(event) => {
                event.preventDefault();
                onOpen();
            }}
            className={twMerge(
                "flex w-full min-w-0 items-center gap-2 rounded-default px-2 py-1.5 border-0 text-ink",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                selected && "bg-ink/5 hover:bg-ink/5",
            )}
        >
            <Span className="truncate text-[13px] font-bold leading-5">{option.label}</Span>
            <Span className="ml-auto shrink-0 text-[12px] leading-4 text-ink-secondary">
                {storageVolumeLabel({ volume: option.spec.volume })}
            </Span>
        </Link>
    );
}
