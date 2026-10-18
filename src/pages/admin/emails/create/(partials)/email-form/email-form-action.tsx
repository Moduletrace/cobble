import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";

export default function EmailFormAction({
    loading,
    existing_full,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_EMAILS>>) {
    return (
        <Button
            title={
                existing_full?.id
                    ? "Update Email"
                    : "Create Email Draft"
            }
            type="submit"
            loading={loading}
        >
            {existing_full?.id ? "Update Email" : "Create Email Draft"}
        </Button>
    );
}