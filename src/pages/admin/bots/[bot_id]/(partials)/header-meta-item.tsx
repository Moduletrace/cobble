import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const BaseClassName =
    "min-w-0 grow overflow-hidden gap-1.5! flex-nowrap text-[13px] leading-[18px] text-ink-secondary";

type Props = {
    icon?: LucideIcon;
    image?: ReactNode;
    /**
     * What the text is, for the tooltip and screen readers.
     */
    label: string;
    text: string;
    /**
     * The tooltip, when it should say more than the label and text (e.g.
     * what clicking does, or why it can't be clicked).
     */
    title?: string;
    /**
     * A button, usually a modal's target: the modal opens on its click.
     */
    button?: boolean;
};

/**
 * One fact under the bot's name in the conversation header: an icon and
 * a line of muted text, or a button opening what edits it.
 */
export default function HeaderMetaItem({
    icon: Icon,
    label,
    text,
    image,
    title,
    button,
}: Props) {
    const tooltip = title || `${label}: ${text}`;
    const content = (
        <>
            {Icon ? (
                <Icon size={13} aria-label={label} className="shrink-0" />
            ) : image ? (
                image
            ) : null}
            <Span className="min-w-0 grow truncate text-left">{text}</Span>
        </>
    );

    if (button) {
        return (
            <Button
                title={tooltip}
                aria-label={tooltip}
                type="button"
                variant="ghost"
                color="text"
                buttonContentProps={{ className: "w-full min-w-0 gap-1.5!" }}
                className={twMerge(
                    "flex w-full items-center justify-start",
                    BaseClassName,
                    "p-0! font-normal rounded-default cursor-pointer dark:text-ink-secondary",
                    "hover:text-ink hover:dark:text-ink hover:underline transition-colors duration-[var(--m-fast)]",
                    "focus-visible:ring-2 focus-visible:ring-ink",
                )}
            >
                {content}
            </Button>
        );
    }

    return (
        <Row title={tooltip} className={BaseClassName}>
            {content}
        </Row>
    );
}
