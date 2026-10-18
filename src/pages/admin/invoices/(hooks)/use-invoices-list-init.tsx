import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";

type Props = {};

export default function useInvoicesListInit(_props?: Props) {
    const {
        res: invoices,
        count,
        page,
        setPage,
        query,
        setQuery,
        limit,
        setLimit,
        ready,
        setReady,
    } = useAdminCrudGet<BUN_SQLITE_BSQLITE_INVOICES>({
        table: "invoices",
    });

    return {
        invoices,
        count,
        page,
        setPage,
        query,
        setQuery,
        limit,
        setLimit,
        ready,
        setReady,
    };
}