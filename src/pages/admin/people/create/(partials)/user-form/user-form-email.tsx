import type { BUN_SQLITE_BSQLITE_USERS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";

export default function UserFormEmail({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_USERS>>) {
    return (
        <>
            <Input
                type="email"
                placeholder="Email Addres"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                    }));
                }}
                defaultValue={form.email}
                showLabel
                required
            />
        </>
    );
}
