import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";

export default function InvoiceFormTitle({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_INVOICES>>) {
    return (
        <Input
            title="Title"
            placeholder="Eg. Deposit Invoice"
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                }));
            }}
            className="text-xl"
            defaultValue={form.title}
            required
            showLabel
        />
    );
}
