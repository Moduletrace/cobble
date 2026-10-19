import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { SettingsPage } from "@/src/dict/settings-pages-dict";

type Props = SettingsPage & {
    selected?: boolean;
};

/**
 * A settings sub page in the rail. Same 48px row and selected state as a
 * bot row; icon only when the rail collapses.
 */
export default function RailSettingsLink({ title, url, Icon, selected }: Props) {
    return (
        <Link
            href={url}
            title={title}
            aria-current={selected ? "page" : undefined}
            className={twMerge(
                "flex shrink-0 h-12 items-center gap-3 rounded-default px-1 @rail:px-3 border-0 leading-normal text-ink",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "bg-ink/5 hover:bg-ink/5",
            )}
        >
            <Span className="size-8 shrink-0 flex items-center justify-center mx-auto @rail:mx-0">
                <Icon size={18} aria-hidden />
            </Span>
            <Span className="hidden @rail:inline text-sm font-bold leading-5 text-ink">
                {title}
            </Span>
        </Link>
    );
}
