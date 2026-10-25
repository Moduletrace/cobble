import Span from "@moduletrace/twui/layout/Span";

type Props = {
    label: string;
    value: string;
};

/**
 * One setting a model was called with, as a small label and value pair:
 * "Temperature 0.3", "Reasoning effort High".
 */
export default function MessageDetailsSetting({ label, value }: Props) {
    return (
        <Span className="text-[12px] leading-4 whitespace-nowrap">
            <Span className="text-ink-secondary">{`${label} `}</Span>
            <Span className="text-ink tabular-nums">{value}</Span>
        </Span>
    );
}
