import type { ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    avatar: ReactNode;
    title: string;
    /**
     * A word beside the title, e.g. "Default" or "You".
     */
    badge?: string;
    subtitle?: string;
    /**
     * Its actions, at the end of the row.
     */
    children?: ReactNode;
};

/**
 * One row of a settings list: an avatar, a title and one line about it,
 * then what can be done with it.
 */
export default function SettingsListRow({ avatar, title, badge, subtitle, children }: Props) {
    return (
        <Row className="w-full min-h-14 gap-3! flex-nowrap items-center px-3 py-2">
            {avatar}
            <Stack className="grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                    {title}
                    {badge ? <Span className="ml-2 text-[11px] font-bold leading-4 text-ink-secondary">{badge}</Span> : null}
                </Span>
                {subtitle ? (
                    <Span className="text-xs leading-4 text-ink-secondary truncate w-full">{subtitle}</Span>
                ) : null}
            </Stack>
            {children ? <Row className="shrink-0 gap-1! flex-nowrap">{children}</Row> : null}
        </Row>
    );
}
