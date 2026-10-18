import SortableLineItemsEditor, {
    makeRowKey,
} from "@/src/components/general/sortable-line-items-editor";
import useFormInit from "@/src/hooks/use-form-init";
import type {
    InvoiceFormObject,
    InvoiceItemFormObject,
} from "../../../(data)/invoice-form-types";

export default function InvoiceFormItems({
    setForm,
    form,
}: ReturnType<typeof useFormInit<InvoiceFormObject>>) {
    const items = form.items || ([] as InvoiceItemFormObject[]);
    const empty_item: InvoiceItemFormObject = {
        description: "",
        quantity: "1",
        unit_price: "",
        _key: makeRowKey(),
    };

    return (
        <SortableLineItemsEditor
            items={items}
            empty_item={empty_item}
            item_placeholder="Eg. Estate service charge - July 2026"
            onChange={(next_items) =>
                setForm((prev) => ({
                    ...prev,
                    items: next_items,
                }))}
        />
    );
}