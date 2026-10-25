import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    label: string;
    value: string;
    /**
     * Shown on hover, for the exact figure behind a rounded one.
     */
    title?: string;
};

/**
 * One fact about how a message was generated: a label on the left, its
 * value on the right, hairline-separated like a settings list.
 */
export default function MessageDetailRow({ label, value, title }: Props) {
    return (
        <Row className="w-full py-2 gap-3! flex-nowrap items-baseline border-0 border-b border-solid border-hairline last:border-b-0">
            <Span className="w-32 shrink-0 text-[12px] leading-4 text-ink-secondary">{label}</Span>
            <Span title={title} className="grow min-w-0 text-[13px] leading-5 text-ink break-words tabular-nums">
                {value}
            </Span>
        </Row>
    );
}
