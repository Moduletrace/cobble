import type { ReactNode } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    avatar: ReactNode;
    title: string;
    /**
     * Where the title links, for rows that open a page.
     */
    href?: string;
    /**
     * A word beside the title, e.g. "Default" or "You".
     */
    badge?: string;
    /**
     * A mark right after the title, e.g. a workspace admin's shield.
     */
    title_icon?: ReactNode;
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
export default function SettingsListRow({ avatar, title, href, badge, title_icon, subtitle, children }: Props) {
    const title_content = (
        <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
            {title}
            {title_icon ? <Span className="ml-1.5 inline-flex align-middle">{title_icon}</Span> : null}
            {badge ? <Span className="ml-2 text-[11px] font-bold leading-4 text-ink-secondary">{badge}</Span> : null}
        </Span>
    );

    return (
        <Row className="w-full min-h-14 gap-3! flex-nowrap items-center px-3 py-2">
            {avatar}
            <Stack className="grow min-w-0 gap-0!">
                {href ? (
                    <Link
                        href={href}
                        title={title}
                        className="block min-w-0 border-0 leading-normal hover:opacity-100 hover:underline focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-default-sm"
                    >
                        {title_content}
                    </Link>
                ) : (
                    title_content
                )}
                {subtitle ? (
                    <Span className="text-xs leading-4 text-ink-secondary truncate w-full">{subtitle}</Span>
                ) : null}
            </Stack>
            {children ? <Row className="shrink-0 gap-1! flex-nowrap">{children}</Row> : null}
        </Row>
    );
}
