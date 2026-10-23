import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { DatabaseRecordsPayload, DatabaseSearchMode } from "@/src/types";

type Params = {
    table: string;
    search: string;
    mode: DatabaseSearchMode;
    page: number;
    /**
     * The records the page already carries, when this is exactly what it
     * is asking for.
     */
    page_records?: DatabaseRecordsPayload | null;
};

/**
 * One page of one table's records. The page's own copy is used when it is
 * what is asked for (no search, first page); anything else loads from the
 * API, so a page never carries a search it may not need.
 */
export default function useDatabaseRecords({ table, search, mode, page, page_records }: Params) {
    const from_page = Boolean(
        page_records &&
            page_records.table.name == table &&
            page_records.page == page &&
            page_records.search == search &&
            page_records.mode == mode,
    );
    const [records, set_records] = useState<DatabaseRecordsPayload | null>(from_page ? page_records || null : null);
    const [loading, set_loading] = useState(!from_page);
    const [error, set_error] = useState<string>();

    useEffect(() => {
        if (from_page) {
            set_records(page_records || null);
            set_loading(false);
            set_error(undefined);
            return;
        }

        const controller = new AbortController();

        const load = async () => {
            set_loading(true);
            set_error(undefined);

            const query = new URLSearchParams({
                table,
                page: String(page),
                mode,
            });

            if (search) query.set("search", search);

            const res = await fetchApi<{}, APIResponseObject<DatabaseRecordsPayload>>(
                `/api/admin/database/records?${query.toString()}`,
                { method: "GET" },
            ).catch(() => null);

            if (controller.signal.aborted) return;

            set_loading(false);

            if (!res?.success || !res.singleRes) {
                set_records(null);
                set_error(res?.msg || `Couldn't read those records.`);
                return;
            }

            set_records(res.singleRes);
        };

        load().catch(() => {});

        return () => controller.abort();
    }, [table, search, mode, page, from_page, page_records]);

    return { records, loading, error };
}
