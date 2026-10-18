import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import Textarea from "@moduletrace/twui/form/Textarea";
import useFormInit from "@/src/hooks/use-form-init";

export default function QuoteFormShortDescription({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_QUOTES>>) {
    return (
        <Textarea
            title="Short Description"
            placeholder="Eg. Short description about this quote. Optional."
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