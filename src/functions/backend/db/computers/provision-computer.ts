import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_COMPUTERS, BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import { AppData } from "@/src/data/app-data";
import createComputerContainer from "@/src/functions/backend/docker/create-computer-container";
import { logError } from "@/src/functions/backend/logger";
import prepareComputerBrowserDir from "./prepare-computer-browser-dir";
import prepareComputerDataDir from "./prepare-computer-data-dir";
import computerBrowserEnv from "@/src/utils/computer-browser-env";
import parseComputerBrowserSettings from "@/src/utils/parse-computer-browser-settings";
import keepComputerSetupAlive from "./keep-computer-setup-alive";
import pushComputerUpdate from "./push-computer-update";
import syncComputerBrowserPolicy from "./sync-computer-browser-policy";

type Params = {
    computer_id: number;
    /**
     * A brand new computer: start from an empty workspace.
     */
    fresh?: boolean;
    /**
     * Pull the image again first (a rebuild), for a newer build under the
     * same tag.
     */
    pull?: boolean;
};

/**
 * Sets up a computer's container: prepares its workspace and browser profile directories, pulls the
 * computer image and starts the container with the computer's resources
 * (`cpus`, `memory_mb`, else the `AppData` defaults) and its browser
 * settings (`browser_settings`, `computerBrowserEnv`), then records it (`containers`:
 * docker id, state, and its IP address on the network). A failure is
 * recorded as `failed` with its reason, which the computer lists show. The
 * owner's tabs hear about it either way. Its browser gets its policy
 * (`syncComputerBrowserPolicy`). The metadata's `layout` says the
 * container runs the current image and mounts (`syncComputers` recreates
 * one that doesn't). While it runs it keeps the row touched
 * (`keepComputerSetupAlive`), so a setup the app lost to a restart is told
 * apart and started again. Never throws.
 */
export default async function provisionComputer({ computer_id, fresh, pull }: Params) {
    const row = (
        await BunSQLite.sql<
            BUN_SQLITE_COBBLE_CONTAINERS & Pick<BUN_SQLITE_COBBLE_COMPUTERS, "cpus" | "memory_mb" | "browser_settings">
        >({
            sql: `SELECT co.*, c.cpus, c.memory_mb, c.browser_settings FROM containers co JOIN computers c ON c.container_id = co.id WHERE c.id = ? LIMIT 1`,
            values: [computer_id],
        })
    ).payload?.[0];

    if (!row?.id || !row.name) return;

    const metadata = parseJobJson({ text: row.metadata }) || {};
    const stopHeartbeat = keepComputerSetupAlive({ container_id: Number(row.id) });

    try {
        await BunSQLite.sql({
            sql: `UPDATE containers SET status = 'creating', updated_at = ? WHERE id = ?`,
            values: [Date.now(), row.id],
        });

        const data_dir = await prepareComputerDataDir({ computer_id, fresh });
        const browser_dir = await prepareComputerBrowserDir({ computer_id, fresh });
        const created = await createComputerContainer({
            computer_id,
            name: row.name,
            data_dir,
            browser_dir,
            cpus: Number(row.cpus) || AppData.ComputerDefaultCpus,
            memory_mb: Number(row.memory_mb) || AppData.ComputerDefaultMemoryMb,
            browser_env: computerBrowserEnv({
                settings: parseComputerBrowserSettings({ text: row.browser_settings }),
                fallback_timezone: process.env.TZ,
            }),
            pull,
        });

        const { error: _error, mcp_url: _mcp_url, ...kept } = metadata;

        await BunSQLite.sql({
            sql: `UPDATE containers SET docker_id = ?, image = ?, network = ?, hostname = ?, ip_address = ?,
                port = ?, status = ?, metadata = ?, last_seen_at = ?, updated_at = ? WHERE id = ?`,
            values: [
                created.docker_id,
                created.image,
                created.network,
                row.name,
                created.ip_address,
                AppData.ComputerPort,
                created.status,
                JSON.stringify({
                    ...kept,
                    data_dir,
                    host_dir: created.host_dir,
                    browser_dir,
                    browser_host_dir: created.browser_host_dir,
                    layout: AppData.ComputerWorkspaceLayout,
                }),
                Date.now(),
                Date.now(),
                row.id,
            ],
        });

        await syncComputerBrowserPolicy({ computer_id, docker_id: created.docker_id });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await BunSQLite.sql({
            sql: `UPDATE containers SET status = 'failed', metadata = ?, updated_at = ? WHERE id = ?`,
            values: [JSON.stringify({ ...metadata, error: message }), Date.now(), row.id],
        }).catch(() => {});

        await logError({ title: `Computer #${computer_id} couldn't be set up`, error }).catch(() => {});
    } finally {
        stopHeartbeat();
    }

    await pushComputerUpdate({ computer_id }).catch(() => {});
}
