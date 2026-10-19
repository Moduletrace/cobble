import { useState } from "react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";

type Status = { error?: boolean; success?: boolean; msg?: string };

type Params<T extends { id?: number | string | "" }> = {
    items: T[];
};

/**
 * A settings list's rows with its busy state and one status line, and
 * `remove`: confirm, post to an admin API route, drop the row.
 */
export default function useSettingsList<T extends { id?: number | string | "" }>({ items: initial }: Params<T>) {
    const [items, setItems] = useState(initial);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<Status>();

    const remove = async ({ id, path, body, confirm }: { id: T["id"]; path: string; body: Record<string, unknown>; confirm: string }) => {
        if (busy || !window.confirm(confirm)) return;

        setBusy(true);
        setStatus(undefined);

        const res = await postAdminApi({ path, body });

        setBusy(false);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        setItems((prev) => prev.filter((item) => item.id != id));
        setStatus({ success: true, msg: res.msg || "Deleted." });
    };

    return { items, setItems, busy, status, setStatus, remove };
}
