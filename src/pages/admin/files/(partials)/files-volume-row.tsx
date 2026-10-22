import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { StorageSpecOption } from "@/src/types";
import { storageSpecHref, storageVolumeLabel } from "@/src/utils/storage-volumes";
import {
    StorageVolumeIconClasses,
    StorageVolumeIcons,
} from "../(data)/storage-volume-icons";

type Props = {
    option: StorageSpecOption;
    selected: boolean;
    onOpen: () => void;
};

/**
 * One folder in the files browser's picker: the bot, workspace, computer,
 * media library, MCP server or database it is, its type an icon in a tinted
 * box and its name beside it. The box carries the type as its title, so
 * hovering names it without spending the row's width on a label.
 */
export default function FilesVolumeRow({ option, selected, onOpen }: Props) {
    const volume = option.spec.volume;
    const Icon = StorageVolumeIcons[volume];
    const type_label = storageVolumeLabel({ volume });

    return (
        <Link
            href={storageSpecHref({ spec: option.spec })}
            title={`${type_label}: ${option.label}`}
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
            <Span
                title={type_label}
                className={twMerge(
                    "size-6 shrink-0 flex items-center justify-center rounded-default-sm",
                    StorageVolumeIconClasses[volume],
                )}
            >
                <Icon size={14} aria-hidden />
            </Span>
            <Span className="min-w-0 flex-1 truncate text-[13px] font-bold leading-5">
                {option.label}
            </Span>
        </Link>
    );
}
