import type { BUN_SQLITE_BSQLITE_LOGS_JOIN } from "@/src/types/sql-joins";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";
import { useEffect, useState } from "react";
import type { LogCategoryValue } from "../(data)/log-category-styles";
import getLogsQuery from "../(utils)/get-logs-query";

type Props = {};

export default function useLogsListInit(_props?: Props) {
    const {
        res: logs,
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
    } = useAdminCrudGet<BUN_SQLITE_BSQLITE_LOGS_JOIN>({
        table: "logs",
        count: true,
        sql_query: getLogsQuery({}),
    });

    const [category, setCategory] = useState<LogCategoryValue | undefined>();
    const [selected_ids, setSelectedIds] = useState<number[]>([]);
    const [active_log, setActiveLog] = useState<BUN_SQLITE_BSQLITE_LOGS_JOIN>();
    const [log_modal_open, setLogModalOpen] = useState(false);

    useEffect(() => {
        if (logs) return;
        setSelectedIds([]);
    }, [logs]);

    const selectCategory = ({ value }: { value?: LogCategoryValue }) => {
        if (value == category) return;
        setCategory(value);
        setQuery(getLogsQuery({ category: value }));
    };

    const toggleSelected = ({ id, checked }: { id: number; checked: boolean }) => {
        setSelectedIds((prev) => {
            const without = prev.filter((prev_id) => prev_id != id);
            return checked ? [...without, id] : without;
        });
    };

    const openLog = ({ log }: { log: BUN_SQLITE_BSQLITE_LOGS_JOIN }) => {
        setActiveLog(log);
        setLogModalOpen(true);
    };

    const toggleSelectAll = ({ checked }: { checked: boolean }) => {
        setSelectedIds(
            checked
                ? (logs || []).map((log) => Number(log.id)).filter(Boolean)
                : [],
        );
    };

    /**
     * Reload the current page, stepping back a page when the delete
     * emptied it.
     */
    const afterDelete = ({ deleted_ids }: { deleted_ids: number[] }) => {
        const remaining = (logs || []).filter(
            (log) => !deleted_ids.includes(Number(log.id)),
        );

        if (!remaining[0] && page > 1) {
            setPage(page - 1);
            return;
        }

        setRes(undefined);
    };

    const all_selected =
        Boolean(logs?.[0]) && selected_ids.length == logs?.length;

    return {
        logs,
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
        category,
        selectCategory,
        selected_ids,
        toggleSelected,
        toggleSelectAll,
        all_selected,
        afterDelete,
        active_log,
        openLog,
        log_modal_open,
        setLogModalOpen,
    };
}
