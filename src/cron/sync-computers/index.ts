import bunext from "@moduletrace/bunext";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import refreshComputerContainer from "@/src/functions/backend/db/computers/refresh-computer-container";

type Row = Pick<BUN_SQLITE_COBBLE_CONTAINERS, "id" | "docker_id" | "status" | "ip_address"> &
    { computer_id: number };

/**
 * Reads every computer container's state from docker and records it
 * (`refreshComputerContainer`), telling owners about changes. Containers
 * still being set up, or that failed, are left alone.
 */
export default async function syncComputers() {
    const rows =
        (
            await BunSQLite.sql<Row>({
                sql: `SELECT co.id, co.docker_id, co.status, co.ip_address, c.id AS computer_id
                    FROM containers co JOIN computers c ON c.container_id = co.id
                    WHERE co.docker_id IS NOT NULL AND co.status NOT IN ('creating', 'failed')`,
            })
        ).payload || [];

    let changed = 0;

    for (const { computer_id, ...container } of rows) {
        const refreshed = await refreshComputerContainer({ computer_id, container });

        if (refreshed?.changed) changed++;
    }

    bunext.bunextLog.info(`Cron: ${rows.length} computer(s) checked, ${changed} changed`);
}
