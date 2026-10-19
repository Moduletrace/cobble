import type { ReactNode } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    description?: ReactNode;
    children: ReactNode;
    /**
     * An anchor, so a link can open the page at this block.
     */
    id?: string;
};

/**
 * One block of settings: what it is on the left, the controls on the right.
 * Stacks below 768px. Blocks are separated by hairlines, never cards.
 */
export default function SettingsGroup({ title, description, children, id }: Props) {
    return (
        <Stack id={id} className="w-full scroll-mt-4 gap-4! md:grid md:grid-cols-[200px_1fr] md:gap-10! py-8 border-0 border-b border-solid border-hairline last:border-b-0">
            <Stack className="gap-1! min-w-0">
                <H2 className="text-sm! leading-5! tracking-normal! font-bold text-ink mb-0!">
                    {title}
                </H2>
                {description ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {description}
                    </Span>
                ) : null}
            </Stack>
            <Stack className="gap-4! min-w-0 w-full items-stretch">
                {children}
            </Stack>
        </Stack>
    );
}
