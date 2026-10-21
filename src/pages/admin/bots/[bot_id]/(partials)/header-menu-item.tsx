import type { LucideIcon } from "lucide-react";
import Loading from "@moduletrace/twui/elements/Loading";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

const RowClassName = "w-full h-9 gap-2.5! flex-nowrap items-center px-3";

type Props = {
    icon: LucideIcon;
    /**
     * The row's label.
     */
    title: string;
    /**
     * A short value shown on the right, e.g. the computer's name.
     */
    hint?: string | null;
    /**
     * The tooltip, e.g. why the row is disabled.
     */
    description?: string;
    /**
     * For a row that opens a page; it navigates rather than acting.
     */
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
};

/**
 * One row in the conversation header's menu: an icon, its label and, when
 * given, a short value. It's a link, an action, or a disabled row.
 */
export default function HeaderMenuItem({
    icon: Icon,
    title,
    hint,
    description,
    href,
    onClick,
    disabled,
    loading,
}: Props) {
    const content = (
        <>
            {loading ? (
                <Loading size="small" className="shrink-0" />
            ) : (
                <Icon size={16} aria-hidden className="shrink-0" />
            )}
            <Span className="min-w-0 grow truncate text-sm leading-5">
                {title}
            </Span>
            {hint ? (
                <Span className="shrink-0 truncate text-[11px] leading-4 text-ink-secondary">
                    {hint}
                </Span>
            ) : null}
        </>
    );

    if (href && !disabled) {
        return (
            <Link
                href={href}
                role="menuitem"
                title={description || title}
                className="block w-full border-0 leading-normal hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
            >
                <Row className={`${RowClassName} text-ink`}>{content}</Row>
            </Link>
        );
    }

    const actionable = !disabled && !loading;

    return (
        <Row
            role="menuitem"
            tabIndex={actionable ? 0 : -1}
            aria-disabled={disabled}
            title={description || title}
            onClick={() => {
                if (actionable) onClick?.();
            }}
            onKeyDown={(event) => {
                if (!actionable) return;
                if (event.key == "Enter" || event.key == " ") {
                    event.preventDefault();
                    onClick?.();
                }
            }}
            className={`${RowClassName} ${
                actionable
                    ? "text-ink cursor-pointer hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
                    : "text-ink-disabled cursor-not-allowed"
            }`}
        >
            {content}
        </Row>
    );
}
