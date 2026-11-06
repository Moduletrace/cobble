import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * The computer's `containers` row.
     */
    container_id: number;
};

/**
 * Touches a container's `updated_at` every `AppData.ComputerSetupHeartbeatMs`
 * while it's `creating`, so a setup that's running (a long pull, a slow
 * health check) is never taken for one the app lost
 * (`computerSetupInterrupted`). Returns the function that stops it.
 */
export default function keepComputerSetupAlive({ container_id }: Params) {
    const timer = setInterval(() => {
        BunSQLite.sql({
            sql: `UPDATE containers SET updated_at = ? WHERE id = ? AND status = 'creating'`,
            values: [Date.now(), container_id],
        }).catch(() => {});
    }, AppData.ComputerSetupHeartbeatMs);

    return () => clearInterval(timer);
}
