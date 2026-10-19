import Button from "@moduletrace/twui/layout/Button";

type Props = {
    title: string;
    label: string;
    /**
     * A link instead of a button.
     */
    href?: string;
    disabled?: boolean;
    onClick?: () => void;
};

/**
 * One small text action on a list row (Edit, Open, Delete).
 */
export default function SettingsRowAction({ title, label, href, disabled, onClick }: Props) {
    return (
        <Button
            title={title}
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            href={href}
            disabled={disabled}
            onClick={onClick}
            className="px-2! text-[13px]"
        >
            {label}
        </Button>
    );
}
