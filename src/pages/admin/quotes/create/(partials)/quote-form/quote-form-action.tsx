import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";
import type { QuoteFormObject } from "../../../(data)/quote-form-types";

export default function QuoteFormAction({
    loading,
    existing_full,
}: ReturnType<typeof useFormInit<QuoteFormObject>>) {
    return (
        <Button
            title={
                existing_full?.id
                    ? "Update Quote"
                    : "Create Quote"
            }
            type="submit"
            loading={loading}
        >
            {existing_full?.id ? "Update Quote" : "Create Quote"}
        </Button>
    );
}