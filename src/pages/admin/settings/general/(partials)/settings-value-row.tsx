import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    label: string;
};

/**
 * One setting read back on its own page: the label the form shows, then
 * its live value. Read-only users see these instead of the form.
 */
export default function SettingsValueRow({ title, label }: Props) {
    return (
        <Row className="w-full gap-3 px-4 py-2 border-0 border-b border-solid border-hairline last:border-b-0">
            <Span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-ink-secondary">{title}</Span>
            <Span className="shrink-0 text-[13px] leading-[18px] font-bold text-ink">{label}</Span>
        </Row>
    );
}