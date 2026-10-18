import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";

type Props = {};

export default function useQuotesListInit(_props?: Props) {
    const {
        res: quotes,
        count,
        page,
        setPage,
        query,
        setQuery,
        limit,
        setLimit,
        ready,
        setReady,
    } = useAdminCrudGet<BUN_SQLITE_BSQLITE_QUOTES>({
        table: "quotes",
    });

    return {
        quotes,
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