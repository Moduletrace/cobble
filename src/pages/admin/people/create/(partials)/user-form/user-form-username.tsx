import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";

export default function UserFormUsername({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_COBBLE_USERS>>) {
    return (
        <>
            <Input
                placeholder="Username"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                    }));
                }}
                defaultValue={form.username}
                showLabel
            />
        </>
    );
}
