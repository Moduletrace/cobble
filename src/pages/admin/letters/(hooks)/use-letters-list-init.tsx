import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";

type Props = {};

export default function useLettersListInit(_props?: Props) {
    const {
        res: letters,
        count,
        page,
        setPage,
        query,
        setQuery,
        limit,
        setLimit,
        ready,
        setReady,
    } = useAdminCrudGet<BUN_SQLITE_BSQLITE_LETTERS>({
        table: "letters",
    });

    return {
        letters,
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