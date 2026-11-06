import Stack from "@moduletrace/twui/layout/Stack";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { ChevronRight } from "lucide-react";

type Props = {
    crumbs: { name: string; href: string }[];
    onOpenFolder: (path: string) => void;
};

/**
 * The trail back up the open folder: the volume's top, then one step per
 * folder. Every crumb but the one being shown opens where it points.
 */
export default function FilesBreadcrumbRow({ crumbs, onOpenFolder }: Props) {
    if (!crumbs.length) return null;

    return (
        <Stack className="w-full mt-4 gap-0! items-center flex-row flex-wrap">
            {crumbs.map((crumb, index) => {
                const last = index == crumbs.length - 1;

                return (
                    <Stack
                        key={crumb.href}
                        className="gap-0! items-center flex-row flex-nowrap min-w-0"
                    >
                        {index ? (
                            <Span className="mx-1 text-ink-secondary" aria-hidden>
                                <ChevronRight size={14} />
                            </Span>
                        ) : null}
                        <Button
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="smaller"
                            disabled={last}
                            onClick={() => onOpenFolder(pathOfHref({ href: crumb.href }))}
                            title={crumb.name || "Top"}
                            className="px-1! py-0.5! text-[12px] font-bold text-ink-secondary"
                        >
                            {crumb.name || "Top"}
                        </Button>
                    </Stack>
                );
            })}
        </Stack>
    );
}

/**
 * The path a crumb's address opens, read back from its query.
 */
function pathOfHref({ href }: { href: string }) {
    const query = href.split("?")[1];

    return new URLSearchParams(query).get("path") || "";
}
