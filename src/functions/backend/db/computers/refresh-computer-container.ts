import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import type { ContainerStatus } from "@/src/dict/computer-dict";
import inspectDockerContainer from "@/src/functions/backend/docker/inspect-docker-container";
import pushComputerUpdate from "./push-computer-update";

type Params = {
    computer_id: number | string;
    container: Pick<BUN_SQLITE_COBBLE_CONTAINERS, "id" | "docker_id" | "status" | "ip_address">;
};

/**
 * Reads a computer container's state from docker and records it
 * (`status`, `ip_address`, which can change when it restarts,
 * `last_seen_at`), telling the owner when its state changed. A container
 * docker no longer has is `dead`. Returns the state recorded, or null
 * when docker couldn't be asked.
 */
export default async function refreshComputerContainer({ computer_id, container }: Params) {
    if (!container.id || !container.docker_id) return null;

    const state = await inspectDockerContainer({ container: container.docker_id }).catch(() => undefined);

    if (state === undefined) return null;

    const status: ContainerStatus = state?.status || "dead";
    const ip_address = state?.ip_address || container.ip_address || null;

    await BunSQLite.sql({
        sql: `UPDATE containers SET status = ?, ip_address = ?, last_seen_at = ?, updated_at = ? WHERE id = ?`,
        values: [status, ip_address, Date.now(), Date.now(), container.id],
    });

    const changed = status != container.status;

    if (changed) await pushComputerUpdate({ computer_id }).catch(() => {});

    return { status, ip_address, changed };
}
