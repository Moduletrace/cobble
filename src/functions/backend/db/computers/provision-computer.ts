import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import { AppData } from "@/src/data/app-data";
import createComputerContainer from "@/src/functions/backend/docker/create-computer-container";
import { logError } from "@/src/functions/backend/logger";
import prepareComputerDataDir from "./prepare-computer-data-dir";
import pushComputerUpdate from "./push-computer-update";

type Params = {
    computer_id: number;
    /**
     * A brand new computer: start from an empty home directory.
     */
    fresh?: boolean;
};

/**
 * Sets up a computer's container: prepares its home directory, pulls the
 * sandbox image and starts the container, then records it (`containers`:
 * docker id, state, and where to reach it outside docker). A failure is
 * recorded as `failed` with its reason, which the computer lists show. The
 * owner's tabs hear about it either way. Never throws.
 */
export default async function provisionComputer({ computer_id, fresh }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONTAINERS>({
            sql: `SELECT co.* FROM containers co JOIN computers c ON c.container_id = co.id WHERE c.id = ? LIMIT 1`,
            values: [computer_id],
        })
    ).payload?.[0];

    if (!row?.id || !row.name) return;

    const metadata = parseJobJson({ text: row.metadata }) || {};

    try {
        await BunSQLite.sql({
            sql: `UPDATE containers SET status = 'creating', updated_at = ? WHERE id = ?`,
            values: [Date.now(), row.id],
        });

        const data_dir = await prepareComputerDataDir({ computer_id, fresh });
        const created = await createComputerContainer({ computer_id, name: row.name, data_dir });

        const { error: _error, mcp_url: _mcp_url, ...kept } = metadata;

        await BunSQLite.sql({
            sql: `UPDATE containers SET docker_id = ?, image = ?, network = ?, hostname = ?, port = ?,
                status = ?, metadata = ?, last_seen_at = ?, updated_at = ? WHERE id = ?`,
            values: [
                created.docker_id,
                AppData.ComputerImage,
                created.network,
                row.name,
                AppData.ComputerPort,
                created.status,
                JSON.stringify({
                    ...kept,
                    data_dir,
                    host_dir: created.host_dir,
                    ...(created.mcp_url ? { mcp_url: created.mcp_url } : {}),
                }),
                Date.now(),
                Date.now(),
                row.id,
            ],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await BunSQLite.sql({
            sql: `UPDATE containers SET status = 'failed', metadata = ?, updated_at = ? WHERE id = ?`,
            values: [JSON.stringify({ ...metadata, error: message }), Date.now(), row.id],
        }).catch(() => {});

        await logError({ title: `Computer #${computer_id} couldn't be set up`, error }).catch(() => {});
    }

    await pushComputerUpdate({ computer_id }).catch(() => {});
}
