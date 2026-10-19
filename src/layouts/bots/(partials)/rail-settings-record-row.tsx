import type { ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    avatar: ReactNode;
    title: string;
    subtitle?: string;
};

/**
 * The record whose settings are open, at the top of its rail. Same 48px
 * row as a bot, selected.
 */
export default function RailSettingsRecordRow({
    avatar,
    title,
    subtitle,
}: Props) {
    return (
        <Row
            aria-current="page"
            className="w-full shrink-0 min-h-12 gap-3! flex-nowrap items-center rounded-default px-1 @rail:px-3 bg-ink/5"
        >
            {avatar}
            <Stack className="hidden @rail:flex grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                    {title}
                </Span>
                {subtitle ? (
                    <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                        {subtitle}
                    </Span>
                ) : null}
            </Stack>
        </Row>
    );
}
