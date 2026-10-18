import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";

export default function QuoteFormTitle({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_QUOTES>>) {
    return (
        <Input
            title="Title"
            placeholder="Eg. Estate Fence Renovation"
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