import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
    icon?: LucideIcon;
    image?: ReactNode;
    /**
     * What the text is, for the tooltip and screen readers.
     */
    label: string;
    text: string;
};

/**
 * One fact under the bot's name in the conversation header: an icon and
 * a line of muted text.
 */
export default function HeaderMetaItem({
    icon: Icon,
    label,
    text,
    image,
}: Props) {
    return (
        <Row
            title={`${label}: ${text}`}
            className="min-w-0 grow overflow-hidden gap-1.5! flex-nowrap text-[13px] leading-[18px] text-ink-secondary"
        >
            {Icon ? (
                <Icon size={13} aria-label={label} className="shrink-0" />
            ) : image ? (
                image
            ) : null}
            <Span className="min-w-0 grow truncate">{text}</Span>
        </Row>
    );
}
