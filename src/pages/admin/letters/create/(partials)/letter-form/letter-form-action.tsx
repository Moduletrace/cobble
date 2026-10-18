import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";

export default function LetterFormAction({
    loading,
    existing_full,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_LETTERS>>) {
    return (
        <Button
            title={
                existing_full?.id
                    ? "Update Letter"
                    : "Create Letter"
            }
            type="submit"
            loading={loading}
        >
            {existing_full?.id ? "Update Letter" : "Create Letter"}
        </Button>
    );
}