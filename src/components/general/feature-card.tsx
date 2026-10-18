import H3 from "@moduletrace/twui/layout/H3";
import Span from "@moduletrace/twui/layout/Span";
import Row from "@moduletrace/twui/layout/Row";
import type { FeatureItem } from "@/src/types";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = FeatureItem & {
    index: number;
};

export default function FeatureCard({
    Icon,
    title,
    description,
    index,
}: Props) {
    return (
        <Stack className="h-full w-full gap-14! justify-between bg-light dark:bg-background-dark p-8 xl:p-10 transition-colors hover:bg-white dark:hover:bg-white/5">
            <Row className="w-full justify-between">
                <Span className="text-xs text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                </Span>
                <Icon size={20} strokeWidth={1.5} className="text-slate-700 dark:text-slate-300" />
            </Row>
            <Stack className="gap-3!">
                <H3>{title}</H3>
                <Span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                </Span>
            </Stack>
        </Stack>
    );
}
