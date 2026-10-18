import SortableLineItemsEditor, {
    makeRowKey,
} from "@/src/components/general/sortable-line-items-editor";
import useFormInit from "@/src/hooks/use-form-init";
import type {
    QuoteFormObject,
    QuoteItemFormObject,
} from "../../../(data)/quote-form-types";

export default function QuoteFormItems({
    setForm,
    form,
}: ReturnType<typeof useFormInit<QuoteFormObject>>) {
    const items = form.items || ([] as QuoteItemFormObject[]);
    const empty_item: QuoteItemFormObject = {
        description: "",
        quantity: "1",
        unit_price: "",
        _key: makeRowKey(),
    };

    return (
        <SortableLineItemsEditor
            items={items}
            empty_item={empty_item}
            item_placeholder="Eg. Supply and installation of estate fencing"
            onChange={(next_items) =>
                setForm((prev) => ({
                    ...prev,
                    items: next_items,
                }))}
        />
    );
}