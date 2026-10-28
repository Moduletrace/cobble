import Button from "@moduletrace/twui/layout/Button";

type Props = {
    title: string;
    value: string;
    disabled?: boolean;
    onMove: (status: string) => void;
};

/**
 * Moves a task to one status: To do, Doing or Done.
 */
export default function TaskStatusMoveButton({ title, value, disabled, onMove }: Props) {
    return (
        <Button
            title={`Mark it ${title.toLowerCase()}`}
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            disabled={disabled}
            onClick={() => onMove(value)}
            className="px-1.5! text-[12px]"
        >
            {title}
        </Button>
    );
}
