import type { BUN_SQLITE_BSQLITE_USERS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import useFormInit from "@/src/hooks/use-form-init";

export default function UserFormName({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_USERS>>) {
    return (
        <Row className="w-full grid xl:grid-cols-2">
            <Input
                title="First Name"
                placeholder="Eg. John"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                    }));
                }}
                defaultValue={form.first_name}
                autoComplete="given-name"
                showLabel
                required
            />

            <Input
                title="Last Name"
                placeholder="Eg. Doe"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                    }));
                }}
                defaultValue={form.last_name}
                autoComplete="family-name"
                showLabel
            />
        </Row>
    );
}
