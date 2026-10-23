import Breadcrumbs from "@moduletrace/twui/elements/Breadcrumbs";
import Stack from "@moduletrace/twui/layout/Stack";
import { ChevronRight } from "lucide-react";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import hasBreadcrumbTrail from "@/src/utils/has-breadcrumb-trail";
import Divider from "@moduletrace/twui/layout/Divider";
import { twMerge } from "tailwind-merge";

type Props = {
    /**
     * The address the page is at, e.g. `/admin/settings/bots/3`.
     */
    pathname?: string | null;
    /**
     * The page's own name, for the last crumb: what the address can't say,
     * since its last segment is an id (`Scout`, not `3`) or a slug that
     * differs from the name the page shows (`MCPs`, not `Mcps`).
     */
    title?: string;
};

/**
 * The trail above a page's content: `Home`, then every section the address
 * passes through, then the page itself, named by `title`.
 *
 * It is `twui`'s `Breadcrumbs`, which reads the trail off the path, so the
 * sections come from the address and only the page's own name is given
 * here; `hasBreadcrumbTrail` says which pages get one at all.
 */
export default function AdminBreadcrumbs({ pathname, title }: Props) {
    if (!hasBreadcrumbTrail({ pathname })) return null;

    return (
        <Stack className={twMerge("w-full shrink-0 pt-5 pb-1")}>
            <Breadcrumbs
                pageUrl={pathname || AdminHomePath}
                currentTitle={title}
                excludeRegexMatch={/^admin$/}
                linkProps={{
                    className:
                        "border-0 text-[13px] leading-[18px] text-ink-secondary no-underline hover:text-ink hover:opacity-100 dark:text-ink-secondary",
                }}
                currentLinkProps={{
                    title,
                    className:
                        "border-0 text-[13px] leading-[18px] text-ink no-underline pointer-events-none dark:text-ink",
                }}
                divider={
                    <ChevronRight
                        size={12}
                        aria-hidden
                        className="shrink-0 text-ink-secondary"
                    />
                }
            />
            <Divider />
        </Stack>
    );
}
