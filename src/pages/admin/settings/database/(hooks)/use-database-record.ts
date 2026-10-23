import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { DatabaseRecordPayload } from "@/src/types";

type Params = {
    /**
     * The table and key of the record the modal is showing; nothing while
     * no record is open.
     */
    table?: string;
    key?: string | number;
    /**
     * Whether the modal is open at all, so nothing loads for a closed one.
     */
    open: boolean;
};

/**
 * One record, in full, for the modal. Loaded when the modal opens (the
 * page's cells are cut short), and loaded again whenever another record is
 * opened, so a click is answered with the whole value.
 */
export default function useDatabaseRecord({ table, key, open }: Params) {
    const [record, set_record] = useState<DatabaseRecordPayload | null>(null);
    const [loading, set_loading] = useState(false);
    const [error, set_error] = useState<string>();

    useEffect(() => {
        if (!open || !table || key === undefined || key === null) return;

        const controller = new AbortController();

        const load = async () => {
            set_loading(true);
            set_error(undefined);
            set_record(null);

            const query = new URLSearchParams({
                table,
                key: String(key),
            });

            const res = await fetchApi<{}, APIResponseObject<DatabaseRecordPayload>>(
                `/api/admin/database/record?${query.toString()}`,
                { method: "GET" },
            ).catch(() => null);

            if (controller.signal.aborted) return;

            set_loading(false);

            if (!res?.success || !res.singleRes) {
                set_error(res?.msg || `Couldn't read that record.`);
                return;
            }

            set_record(res.singleRes);
        };

        load().catch(() => {});

        return () => controller.abort();
    }, [table, key, open]);

    return { record, loading, error };
}
