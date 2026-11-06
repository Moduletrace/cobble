import bunext from "@moduletrace/bunext";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import logEvent from "@/src/functions/backend/logger";
import migrateComputerLayout from "@/src/functions/backend/db/computers/migrate-computer-layout";
import provisionComputer from "@/src/functions/backend/db/computers/provision-computer";
import refreshComputerContainer from "@/src/functions/backend/db/computers/refresh-computer-container";
import syncComputerBrowserPolicy from "@/src/functions/backend/db/computers/sync-computer-browser-policy";

type Row = Pick<
    BUN_SQLITE_COBBLE_CONTAINERS,
    "id" | "docker_id" | "status" | "ip_address" | "metadata"
> & { computer_id: number };

/**
 * Reads every computer container's state from docker and records it
 * (`refreshComputerContainer`), telling owners about changes. Containers
 * still being set up, or that failed, are left alone. A container that
 * still mounts its computer's whole home is recreated with only the
 * workspace (`migrateComputerLayout`, once per computer). A running one
 * gets the browser policy it lacks (`syncComputerBrowserPolicy`), so
 * computers made before an extension was added get it too. A setup the app
 * lost mid-way (still `creating`, untouched for
 * `AppData.ComputerSetupStaleMs`: the process doing it is gone) is started
 * again in the background.
 */
export default async function syncComputers() {
    await resumeInterruptedSetups();

    const rows =
        (
            await BunSQLite.sql<Row>({
                sql: `SELECT co.id, co.docker_id, co.status, co.ip_address, co.metadata, c.id AS computer_id
                    FROM containers co JOIN computers c ON c.container_id = co.id
                    WHERE co.docker_id IS NOT NULL AND co.status NOT IN ('creating', 'failed')`,
            })
        ).payload || [];

    let changed = 0;

    for (const { computer_id, metadata, ...container } of rows) {
        if (await migrateComputerLayout({ computer_id, metadata })) continue;

        const refreshed = await refreshComputerContainer({
            computer_id,
            container,
        });

        if (refreshed?.changed) changed++;

        if (refreshed?.status == "running" && container.docker_id) {
            await syncComputerBrowserPolicy({ computer_id, docker_id: container.docker_id });
        }
    }
}

async function resumeInterruptedSetups() {
    const lost =
        (
            await BunSQLite.sql<{ computer_id: number }>({
                sql: `SELECT c.id AS computer_id FROM containers co JOIN computers c ON c.container_id = co.id
                    WHERE co.status = 'creating' AND co.updated_at < ?`,
                values: [Date.now() - AppData.ComputerSetupStaleMs],
            })
        ).payload || [];

    for (const { computer_id } of lost) {
        await logEvent({
            title: `Computer #${computer_id} set up again`,
            category: "system",
            plain_text: `Setting computer #${computer_id} up was interrupted (the app restarted mid-way); starting it again.`,
            metadata: { computer_id },
        }).catch(() => {});

        provisionComputer({ computer_id: Number(computer_id) });
    }
}
