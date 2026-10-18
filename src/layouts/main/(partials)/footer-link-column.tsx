import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import LinkList from "@moduletrace/twui/elements/LinkList";
import type { FooterColumn } from "../(data)/footer-columns";

type Props = FooterColumn;

export default function FooterLinkColumn({ label, links }: Props) {
    return (
        <Stack className="gap-5! min-w-[160px]">
            <Span className="text-xs text-slate-400 dark:text-slate-500">
                {label}
            </Span>
            <LinkList
                links={links}
                className="flex-col items-start gap-3"
                linkProps={{ className: "p-0 text-sm border-0" }}
            />
        </Stack>
    );
}
