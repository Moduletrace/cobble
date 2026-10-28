import type { ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    label: string;
    children: ReactNode;
};

/**
 * One fact about an opened task: a label, then its value.
 */
export default function TaskFactRow({ label, children }: Props) {
    return (
        <Row className="w-full gap-3! flex-nowrap items-center">
            <Span className="w-24 shrink-0 text-[12px] leading-[18px] text-ink-secondary">{label}</Span>
            <Row className="grow min-w-0 gap-2! flex-nowrap items-center text-[13px] leading-[18px] text-ink">
                {children}
            </Row>
        </Row>
    );
}
