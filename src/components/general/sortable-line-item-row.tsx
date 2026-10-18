import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Input from "@moduletrace/twui/form/Input";
import Button from "@moduletrace/twui/layout/Button";
import Paper from "@moduletrace/twui/elements/Paper";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Border from "@moduletrace/twui/elements/Border";
import { formatNaira } from "@/src/utils/money";
import twuiNumberfy from "@moduletrace/twui/utils/numberfy";

export type SortableLineItemFormObject = {
    description?: string;
    quantity?: string;
    /** Naira amount as a plain number string (converted to kobo on submit). */
    unit_price?: string;
    /** Client-side row identity for stable React keys during reorder. */
    _key?: string;
};

type Props<T extends SortableLineItemFormObject> = {
    item: T;
    index: number;
    placeholder: string;
    is_dragging: boolean;
    is_drop_target: boolean;
    /** Whether a drag is currently in progress anywhere in the list. */
    drag_active: boolean;
    can_move_up: boolean;
    can_move_down: boolean;
    onChange: (item: T) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDragStart: () => void;
    onDragOver: () => void;
    onDragLeave: () => void;
    /** `drop_after` is true when dropped on the lower half of this row. */
    onDrop: (drop_after: boolean) => void;
    onDragEnd: () => void;
};

export default function SortableLineItemRow<
    T extends SortableLineItemFormObject,
>({
    item,
    index,
    placeholder,
    is_dragging,
    is_drop_target,
    drag_active,
    can_move_up,
    can_move_down,
    onChange,
    onRemove,
    onMoveUp,
    onMoveDown,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
}: Props<T>) {
    const line_total_kobo =
        (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) * 100;

    return (
        <Paper
            className={[
                "w-full gap-3!",
                is_dragging && "opacity-60",
                is_drop_target && "ring-2 ring-primary/70",
            ]
                .filter(Boolean)
                .join(" ")}
            onDragOver={(e) => {
                if (!drag_active) return;
                e.preventDefault();
                onDragOver();
            }}
            onDragLeave={() => {
                if (drag_active) onDragLeave();
            }}
            onDrop={(e) => {
                if (!drag_active) return;
                e.preventDefault();
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                onDrop(e.clientY - rect.top > rect.height / 2);
            }}
        >
            <Row className="w-full justify-between items-center gap-2!">
                <Row className="gap-2! items-center">
                    <Span
                        title="Drag to reorder"
                        className="cursor-grab select-none p-1 -m-1!"
                        draggable
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    >
                        <LucideIcon name="GripVertical" size={16} />
                    </Span>
                    <Span className="text-xs font-semibold opacity-60">
                        Item #{index + 1}
                    </Span>
                </Row>
                <Row className="gap-1! items-center">
                    <Button
                        title="Move Up"
                        variant="ghost"
                        color="gray"
                        size="smaller"
                        disabled={!can_move_up}
                        onClick={onMoveUp}
                    >
                        <LucideIcon name="ArrowUp" size={14} />
                    </Button>
                    <Button
                        title="Move Down"
                        variant="ghost"
                        color="gray"
                        size="smaller"
                        disabled={!can_move_down}
                        onClick={onMoveDown}
                    >
                        <LucideIcon name="ArrowDown" size={14} />
                    </Button>
                    <Button
                        title="Remove Line Item"
                        variant="ghost"
                        color="error"
                        size="smaller"
                        onClick={onRemove}
                    >
                        <LucideIcon name="Trash2" size={14} />
                    </Button>
                </Row>
            </Row>

            <Input
                title="Description"
                placeholder={placeholder}
                defaultValue={item.description}
                onChange={(e) => {
                    onChange({ ...item, description: e.target.value });
                }}
                showLabel
            />

            <Row className="w-full grid xl:grid-cols-3 items-stretch">
                <Input
                    title="Quantity"
                    type="number"
                    min={1}
                    defaultValue={item.quantity}
                    onChange={(e) => {
                        onChange({ ...item, quantity: e.target.value });
                    }}
                    showLabel
                />

                <Input
                    title="Unit Price (₦)"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={item.unit_price}
                    onChange={(e) => {
                        onChange({
                            ...item,
                            unit_price: Math.round(
                                twuiNumberfy(e.target.value),
                            ).toString(),
                        });
                    }}
                    showLabel
                />

                <Border className="py-1 px-4">
                    <Span className="text-sm font-semibold">
                        {formatNaira(line_total_kobo)}
                    </Span>
                </Border>
            </Row>
        </Paper>
    );
}