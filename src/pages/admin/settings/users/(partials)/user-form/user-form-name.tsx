import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import useFormInit from "@/src/hooks/use-form-init";

export default function UserFormName({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_COBBLE_USERS>>) {
    return (
        <Row className="w-full grid sm:grid-cols-2 gap-4!">
            <Input
                id="user-form-first-name"
                title="First name"
                label="First name"
                placeholder="Ada"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                    }));
                }}
                defaultValue={form.first_name}
                autoComplete="off"
                showLabel
                required
            />

            <Input
                id="user-form-last-name"
                title="Last name"
                label="Last name"
                placeholder="Lovelace"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                    }));
                }}
                defaultValue={form.last_name}
                autoComplete="off"
                showLabel
            />
        </Row>
    );
}
