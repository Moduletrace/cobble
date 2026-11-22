import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { ReactNode } from "react";

type Props = {
    title: string;
    /**
     * One line under the title, saying what the section is.
     */
    description: string;
    children?: ReactNode;
};

/**
 * One labelled part of the bot panel's tools tab: what it is, then its
 * list.
 */
export default function BotPanelSection({ title, description, children }: Props) {
    return (
        <Stack className="w-full gap-1! items-stretch pb-4 border-0 border-b border-solid border-hairline last:border-b-0 last:pb-0">
            <Span className="text-[13px] leading-[18px] font-bold text-ink">{title}</Span>
            <Span className="text-[13px] leading-[18px] text-ink-secondary">{description}</Span>
            {children}
        </Stack>
    );
}