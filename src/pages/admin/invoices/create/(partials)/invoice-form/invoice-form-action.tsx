import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";
import type { InvoiceFormObject } from "../../../(data)/invoice-form-types";

export default function InvoiceFormAction({
    loading,
    existing_full,
}: ReturnType<typeof useFormInit<InvoiceFormObject>>) {
    return (
        <Button
            title={
                existing_full?.id
                    ? "Update Invoice"
                    : "Create Invoice"
            }
            type="submit"
            loading={loading}
        >
            {existing_full?.id ? "Update Invoice" : "Create Invoice"}
        </Button>
    );
}