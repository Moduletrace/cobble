import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";

export default function LetterFormTitle({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_LETTERS>>) {
    return (
        <Input
            title="Title"
            placeholder="Eg. Annual General Meeting Letter"
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                }));
            }}
            className="text-xl"
            defaultValue={form.title}
            showLabel
        />
    );
}
