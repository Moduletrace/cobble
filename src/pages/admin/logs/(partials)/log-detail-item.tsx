import type { ReactNode } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

export type LogDetailItemProps = {
    label: string;
    value: ReactNode;
};

export default function LogDetailItem({ label, value }: LogDetailItemProps) {
    return (
        <Row className="w-full justify-between gap-4! flex-nowrap py-2 border-b border-slate-200 dark:border-white/10">
            <Span size="small" variant="faded">
                {label}
            </Span>
            <Span size="small" className="text-right break-all">
                {value}
            </Span>
        </Row>
    );
}
