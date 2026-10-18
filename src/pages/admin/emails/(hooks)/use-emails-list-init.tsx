import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";

type Props = {};

export default function useEmailsListInit(_props?: Props) {
    const {
        res: emails,
        setRes,
        count,
        page,
        setPage,
        query,
        setQuery,
        limit,
        setLimit,
        ready,
        setReady,
    } = useAdminCrudGet<BUN_SQLITE_BSQLITE_EMAILS>({
        table: "emails",
    });

    return {
        emails,
        setRes,
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