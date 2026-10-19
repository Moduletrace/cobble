import Button from "@moduletrace/twui/layout/Button";

type Props = {
    title: string;
    label: string;
    disabled?: boolean;
    onClick: () => void;
};

/**
 * One small text action on a workspace computer row.
 */
export default function WorkspaceComputerAction({ title, label, disabled, onClick }: Props) {
    return (
        <Button
            title={title}
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            disabled={disabled}
            onClick={onClick}
            className="px-2! text-[13px]"
        >
            {label}
        </Button>
    );
}
