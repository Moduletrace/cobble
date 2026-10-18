import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import type { HeroSpec } from "../(data)/hero-specs";

type Props = HeroSpec & {
    index: number;
};

export default function HeroSpecItem({ label, value, index }: Props) {
    return (
        <Stack className="gap-2! py-6 pr-6 border-t border-slate-300 dark:border-white/20">
            <Span className="text-xs text-slate-400">
                {String(index + 1).padStart(2, "0")} / {label}
            </Span>
            <Span className="text-lg font-medium tracking-tight text-foreground-light dark:text-foreground-dark">
                {value}
            </Span>
        </Stack>
    );
}
