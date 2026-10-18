import type { BUN_SQLITE_BSQLITE_USERS } from "@/db/types/db";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";

export default function UserFormAction({
    setForm,
    existing,
    existing_full,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_USERS>>) {
    const title = existing_full?.id ? "Update User" : "Create New User";

    return (
        <>
            <Button title={title}>{title}</Button>
        </>
    );
}
