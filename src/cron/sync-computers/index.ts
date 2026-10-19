import bunext from "@moduletrace/bunext";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_COMPUTERS, BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import pushComputerUpdate from "@/src/functions/backend/db/computers/push-computer-update";
import inspectDockerContainer from "@/src/functions/backend/docker/inspect-docker-container";

type Row = Pick<BUN_SQLITE_COBBLE_CONTAINERS, "id" | "docker_id" | "status"> &
    Pick<BUN_SQLITE_COBBLE_COMPUTERS, "user_id"> & { computer_id: number };

/**
 * Reads every computer container's state from docker and records it
 * (`containers.status`, `last_seen_at`), telling owners about changes. A
 * container docker no longer has shows as `dead`. Containers still being
 * set up, or that failed, are left alone.
 */
export default async function syncComputers() {
    const rows =
        (
            await BunSQLite.sql<Row>({
                sql: `SELECT co.id, co.docker_id, co.status, c.user_id, c.id AS computer_id
                    FROM containers co JOIN computers c ON c.container_id = co.id
                    WHERE co.docker_id IS NOT NULL AND co.status NOT IN ('creating', 'failed')`,
            })
        ).payload || [];

    let changed = 0;

    for (const row of rows) {
        const state = await inspectDockerContainer({ container: row.docker_id! }).catch(() => undefined);

        if (state === undefined) continue;

        const status = state?.status || "dead";

        await BunSQLite.sql({
            sql: `UPDATE containers SET status = ?, last_seen_at = ?, updated_at = ? WHERE id = ?`,
            values: [status, Date.now(), Date.now(), row.id!],
        });

        if (status != row.status) {
            changed++;
            await pushComputerUpdate({ computer_id: row.computer_id }).catch(() => {});
        }
    }

    bunext.bunextLog.info(`Cron: ${rows.length} computer(s) checked, ${changed} changed`);
}
