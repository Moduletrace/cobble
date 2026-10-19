import { useContext } from "react";
import Breadcrumbs from "@moduletrace/twui/elements/Breadcrumbs";
import Stack from "@moduletrace/twui/layout/Stack";
import { ChevronRight } from "lucide-react";
import { AppContext } from "@/src/pages/__root";

type Props = {
    /**
     * The record's name, shown where the URL has its id.
     */
    title: string;
};

/**
 * The hierarchy above a nested settings page: Settings / Bots / Scout.
 * Built from the path, with the record's name replacing its id.
 */
export default function SettingsBreadcrumbs({ title }: Props) {
    const { pageProps } = useContext(AppContext);
    const pathname = pageProps?.url?.pathname;

    if (!pathname) return null;

    return (
        <Stack className="w-full shrink-0 pt-5 pb-1">
            <Breadcrumbs
                pageUrl={pathname}
                currentTitle={title}
                skipHome
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
        </Stack>
    );
}
