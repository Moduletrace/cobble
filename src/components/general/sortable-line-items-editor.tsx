import Button from "@moduletrace/twui/layout/Button";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { useEffect, useState } from "react";
import { formatNaira, sumInvoiceItemsKobo } from "@/src/utils/money";
import SortableLineItemRow, {
    type SortableLineItemFormObject,
} from "./sortable-line-item-row";

let row_key_counter = 0;

export const makeRowKey = (): string =>
    typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `row-${Date.now()}-${row_key_counter++}`;

type Props<T extends SortableLineItemFormObject> = {
    items: T[];
    empty_item: T;
    item_placeholder: string;
    onChange: (items: T[]) => void;
};

export default function SortableLineItemsEditor<
    T extends SortableLineItemFormObject,
>({ items, empty_item, item_placeholder, onChange }: Props<T>) {
    const [drag_source, set_drag_source] = useState<number | undefined>();
    const [drag_target, set_drag_target] = useState<number | undefined>();

    useEffect(() => {
        if (items.some((item) => !item._key)) {
            onChange(
                items.map((item) => ({ ...item, _key: makeRowKey() })),
            );
        }
    }, []);

    const display_items = items.length ? items : [empty_item];
    const can_remove = items.length > 1;

    const setItems = (next_items: T[]) => onChange(next_items);

    const endDrag = () => {
        set_drag_source(undefined);
        set_drag_target(undefined);
    };

    const moveTo = (from: number | undefined, target: number, drop_after: boolean) => {
        if (from === undefined || from === target) return;

        let to = drop_after ? target + 1 : target;
        if (from < to) to -= 1;
        if (to === from) return;

        const next_items = items.length ? [...items] : [{ ...empty_item }];
        const moved_item: T = next_items[from] as T;
        next_items.splice(from, 1);
        next_items.splice(to, 0, moved_item);
        setItems(next_items);
    };

    const moveBy = (index: number, delta: -1 | 1) => {
        const target = index + delta;
        if (target < 0 || target >= (items.length ? items.length : 1)) return;
        moveTo(index, target, delta === 1);
    };

    const total_kobo = sumInvoiceItemsKobo(
        items.map((item) => ({
            quantity: item.quantity,
            unit_price_kobo: (Number(item.unit_price) || 0) * 100,
        })),
    );

    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Line Items</H3>

            {display_items.map((item, index) => (
                <SortableLineItemRow
                    key={item._key || index}
                    item={item}
                    index={index}
                    placeholder={item_placeholder}
                    is_dragging={drag_source === index}
                    is_drop_target={
                        drag_source !== undefined &&
                            drag_source !== index &&
                            drag_target === index
                    }
                    drag_active={drag_source !== undefined}
                    can_move_up={index > 0}
                    can_move_down={index < items.length - 1}
                    onChange={(next_item) => {
                        const next_items = items.length
                            ? [...items]
                            : [{ ...empty_item }];
                        next_items[index] = next_item;
                        setItems(next_items);
                    }}
                    onRemove={() => {
                        if (!can_remove) return;
                        setItems(items.filter((_, i) => i !== index));
                    }}
                    onMoveUp={() => moveBy(index, -1)}
                    onMoveDown={() => moveBy(index, 1)}
                    onDragStart={() => {
                        if (items.length < 2 || drag_source !== undefined) return;
                        set_drag_source(index);
                    }}
                    onDragOver={() => {
                        if (
                            drag_source === undefined ||
                                drag_source === index ||
                                drag_target === index
                        ) return;
                        set_drag_target(index);
                    }}
                    onDragLeave={() => {
                        if (drag_target === index) {
                            set_drag_target(undefined);
                        }
                    }}
                    onDrop={(drop_after) => {
                        moveTo(drag_source, index, drop_after);
                        endDrag();
                    }}
                    onDragEnd={endDrag}
                />
            ))}

            <Row className="w-full justify-between items-center">
                <Button
                    title="Add Line Item"
                    color="gray"
                    onClick={(e) => {
                        e.preventDefault();
                        setItems([
                            ...items,
                            { ...empty_item, _key: makeRowKey() },
                        ]);
                    }}
                >
                    Add Line Item
                </Button>

                <Span className="text-base font-semibold">
                    Total: {formatNaira(total_kobo)}
                </Span>
            </Row>
        </Stack>
    );
}