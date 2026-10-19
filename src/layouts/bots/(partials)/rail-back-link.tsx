import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { ArrowLeft } from "lucide-react";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import { SiteData } from "@/src/data/site-data";

type Props = {
    title?: string;
    href?: string;
};

/**
 * Top of the rail on settings and workspace pages, returning to the
 * conversations. Same 48px row as a bot.
 */
export default function RailBackLink({
    title = `Back to ${SiteData["SiteSlug"]}`,
    href = AdminHomePath,
}: Props) {
    return (
        <Link
            href={href}
            title={title}
            className="flex shrink-0 h-12 items-center gap-3 rounded-default px-1 lg:px-3 border-0 leading-normal text-ink hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
            <Span className="size-8 shrink-0 flex items-center justify-center mx-auto lg:mx-0">
                <ArrowLeft size={18} aria-hidden />
            </Span>
            <Span className="hidden lg:block min-w-0 truncate text-sm font-bold leading-5 text-ink">
                {title}
            </Span>
        </Link>
    );
}
