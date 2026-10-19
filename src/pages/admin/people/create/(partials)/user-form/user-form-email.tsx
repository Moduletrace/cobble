import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";

export default function UserFormEmail({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_COBBLE_USERS>>) {
    return (
        <Input
            id="user-form-email"
            title="Email"
            label="Email"
            type="email"
            placeholder="ada@example.com"
            autoComplete="off"
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
    );
}
