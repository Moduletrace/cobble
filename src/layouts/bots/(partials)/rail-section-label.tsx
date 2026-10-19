import type { ReactNode } from "react";
import Divider from "@moduletrace/twui/layout/Divider";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    /**
     * A small control on the right, e.g. the "+" beside Workspaces.
     */
    action?: ReactNode;
};

/**
 * Heads a section of the rail. When the rail collapses to icons it's a
 * hairline instead.
 */
export default function RailSectionLabel({ title, action }: Props) {
    return (
        <>
            <Row className="hidden @rail:flex shrink-0 h-8 mt-3 gap-2! flex-nowrap items-center justify-between px-3">
                <Span className="text-[11px] font-bold uppercase tracking-wide leading-4 text-ink-secondary">
                    {title}
                </Span>
                {action}
            </Row>
            <Divider className="@rail:hidden shrink-0 mx-1 my-2 w-auto border-hairline dark:border-hairline" />
        </>
    );
}
