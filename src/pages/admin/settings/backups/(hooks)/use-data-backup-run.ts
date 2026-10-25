import { useContext, useEffect, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import { AppData } from "@/src/data/app-data";
import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";
import type { DataBackupRun, DataBackupStatus } from "@/src/types";
import type { DataBackupRunState } from "../(data)/data-backup-run-context";

/**
 * Follows a whole-data archive or restore, which runs in the background
 * on the server, by polling `data-status` every `AppData.DataBackupPollMs`.
 * An archive reloads the page once it is written. A restore restarts the
 * app, so failed polls are expected and the page reloads once the status
 * comes from a new boot (or after `AppData.DataRestoreWaitMs` anyway).
 * Picks a run already going back up from the page props.
 */
export default function useDataBackupRun(): DataBackupRunState {
    const { pageProps } = useContext(AppContext);
    const initial = pageProps?.data_backup_run;
    const [run, setRun] = useState<DataBackupRun | undefined>(
        initial?.status == "running" ? initial : undefined,
    );
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (run?.status != "running") return;

        const active = run;

        const deadline = Date.now() + AppData.DataRestoreWaitMs;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;

        const fail = (msg: string) => {
            setError(msg);
            setRun(undefined);
        };

        const poll = async () => {
            const res = await adminFetchHandler({
                url: "/api/admin/backups/data-status",
            });

            if (stopped) return;

            const current = res.success
                ? (res.singleRes as DataBackupStatus | undefined)?.run
                : undefined;
            const restarted = Boolean(
                current && current.boot_id != active.boot_id,
            );

            if (active.kind == "restore") {
                if (restarted || Date.now() > deadline) {
                    window.location.reload();
                    return;
                }

                if (current?.status == "failed") {
                    fail(current.error || `Couldn't restore archive`);
                    return;
                }
            } else if (current) {
                if (current.status == "done") {
                    window.location.reload();
                    return;
                }

                if (current.status == "failed") {
                    fail(current.error || `Couldn't create archive`);
                    return;
                }

                if (restarted) {
                    fail(`The app restarted before the archive was finished`);
                    return;
                }
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
        run,
        error,
        track: (next) => {
            setError(undefined);
            setRun(next);
        },
    };
}
