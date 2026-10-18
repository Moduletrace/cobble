import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import Textarea from "@moduletrace/twui/form/Textarea";
import useFormInit from "@/src/hooks/use-form-init";

export default function InvoiceFormShortDescription({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_INVOICES>>) {
    return (
        <Textarea
            title="Short Description"
            placeholder="Eg. Short description about this invoice. Optional."
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    short_description: e.target.value,
                }));
            }}
            defaultValue={form.short_description}
            showLabel
        />
    );
}
