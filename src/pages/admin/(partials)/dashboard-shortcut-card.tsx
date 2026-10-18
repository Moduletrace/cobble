import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import H3 from "@moduletrace/twui/layout/H3";
import { ArrowUpRight } from "lucide-react";
import type { DashboardShortcut } from "../(data)/dashboard-shortcuts";

type Props = DashboardShortcut;

export default function DashboardShortcutCard({
    title,
    description,
    url,
    Icon,
}: Props) {
    return (
        <a href={url} className="group block h-full">
            <Stack className="h-full w-full gap-10! rounded-default-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 transition-all hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md hover:shadow-slate-900/5 dark:hover:shadow-none">
                <Row className="w-full justify-between">
                    <Row className="size-9 justify-center rounded-default bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        <Icon size={17} strokeWidth={1.75} />
                    </Row>
                    <ArrowUpRight
                        size={16}
                        className="text-slate-300 dark:text-slate-600 transition-colors group-hover:text-accent"
                    />
                </Row>
                <Stack className="gap-1.5!">
                    <H3>{title}</H3>
                    <Span className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {description}
                    </Span>
                </Stack>
            </Stack>
        </a>
    );
}
