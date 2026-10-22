import type { AnchorHTMLAttributes, DetailedHTMLProps } from "react";
import Button from "@moduletrace/twui/layout/Button";
import type { LucideIcon } from "lucide-react";

type Props = {
    icon: LucideIcon;
    /**
     * Says what the button does; the button shows only the icon.
     */
    title: string;
    disabled?: boolean;
    loading?: boolean;
    /**
     * For a link action (a download); leaves out `onClick`.
     */
    href?: string;
    linkProps?: DetailedHTMLProps<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
    >;
    onClick?: () => void;
};

/**
 * One icon-only action on a list row (download, restore, delete), with its
 * label kept for the tooltip and screen readers.
 */
export default function RowIconButton({
    icon: Icon,
    title,
    disabled,
    loading,
    href,
    linkProps,
    onClick,
}: Props) {
    return (
        <Button
            title={title}
            aria-label={title}
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            href={href}
            linkProps={linkProps}
            disabled={disabled}
            loading={loading}
            onClick={onClick}
        >
            <Icon size={16} aria-hidden />
        </Button>
    );
}
