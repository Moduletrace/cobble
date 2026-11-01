import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import inspectDockerContainer from "@/src/functions/backend/docker/inspect-docker-container";
import restartDockerContainer from "@/src/functions/backend/docker/restart-docker-container";
import { logError } from "@/src/functions/backend/logger";
import prepareComputerBrowserDir from "./prepare-computer-browser-dir";
import provisionComputer from "./provision-computer";
import pushComputerUpdate from "./push-computer-update";
import syncComputerBrowserPolicy from "./sync-computer-browser-policy";

type Params = {
    computer_id: number;
};

/**
 * Restarts a computer's own container, so what's installed in it stays,
 * unlike `provisionComputer`, which it falls back to when docker no longer
 * has the container. It's `creating` meanwhile, which keeps runs off it
 * and `syncComputers` away. Chrome's links are cleared while it's stopped
 * (`prepareComputerBrowserDir`): the processes they name are gone and
 * their ids get reused. A failure is recorded as `failed` with its reason,
 * and the computer's audience hears about it either way. A notification
 * watcher comes back with the `sync-notify-watchers` cron. Never throws.
 */
export default async function restartComputer({ computer_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONTAINERS>({
            sql: `SELECT co.* FROM containers co
                JOIN computers c ON c.container_id = co.id
                WHERE c.id = ? LIMIT 1`,
            values: [computer_id],
        })
    ).payload?.[0];

    if (!row?.id) return;

    const metadata = parseJobJson({ text: row.metadata }) || {};

    try {
        const docker_id = row.docker_id;
        const existing = docker_id ? await inspectDockerContainer({ container: docker_id }) : null;

        if (!docker_id || !existing) {
            await provisionComputer({ computer_id });
            return;
        }

        await BunSQLite.sql({
            sql: `UPDATE containers SET status = 'creating', updated_at = ? WHERE id = ?`,
            values: [Date.now(), row.id],
        });

        await pushComputerUpdate({ computer_id }).catch(() => {});

        const state = await restartDockerContainer({
            container: docker_id,
            whileStopped: () => prepareComputerBrowserDir({ computer_id }),
        });

        const { error: _error, ...kept } = metadata;

        await BunSQLite.sql({
            sql: `UPDATE containers SET status = ?, ip_address = ?, metadata = ?, last_seen_at = ?, updated_at = ? WHERE id = ?`,
            values: [
                state.status,
                state.ip_address || row.ip_address || null,
                JSON.stringify(kept),
                Date.now(),
                Date.now(),
                row.id,
            ],
        });

        await syncComputerBrowserPolicy({ computer_id, docker_id });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await BunSQLite.sql({
            sql: `UPDATE containers SET status = 'failed', metadata = ?, updated_at = ? WHERE id = ?`,
            values: [JSON.stringify({ ...metadata, error: message }), Date.now(), row.id],
        }).catch(() => {});

        await logError({ title: `Computer #${computer_id} couldn't be restarted`, error }).catch(() => {});
    }

    await pushComputerUpdate({ computer_id }).catch(() => {});
}
