import { useEffect, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import { AppData } from "@/src/data/app-data";
import type { BootstrapStatus, DataBackupRun } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

const LoginPath = "/auth/login";

/**
 * Follows a restore started from first-run setup by polling
 * `bootstrap-status` every `AppData.DataBackupPollMs`. The app restarts
 * once the backup is in, so failed polls are expected; the page goes to
 * the login once the status comes from a new boot or accounts exist (or
 * after `AppData.DataRestoreWaitMs` anyway, where the guard sends it back
 * to setup if nothing was restored).
 */
export default function useBootstrapRestore() {
    const [run, setRun] = useState<DataBackupRun>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (run?.status != "running") return;

        const active = run;
        const deadline = Date.now() + AppData.DataRestoreWaitMs;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;

        const poll = async () => {
            const res = await fetchApi<{}, APIResponseObject<BootstrapStatus>>(
                `/api/auth/bootstrap-status`,
                { method: "GET" },
            ).catch(() => undefined);

            if (stopped) return;

            const current = res?.success ? res.singleRes : undefined;
            const restarted = Boolean(
                current && current.boot_id != active.boot_id,
            );

            if (current?.has_users || restarted || Date.now() > deadline) {
                window.location.pathname = LoginPath;
                return;
            }

            if (current?.status == "failed") {
                setError(current.error || `Couldn't restore the backup`);
                setRun(undefined);
                return;
            }

            timeout = setTimeout(poll, AppData.DataBackupPollMs);
        };

        timeout = setTimeout(poll, AppData.DataBackupPollMs);

        return () => {
            stopped = true;
            if (timeout) clearTimeout(timeout);
        };
    }, [run]);

    return {
        restoring: run?.status == "running",
        error,
        track: (next: DataBackupRun) => {
            setError(undefined);
            setRun(next);
        },
    };
}
