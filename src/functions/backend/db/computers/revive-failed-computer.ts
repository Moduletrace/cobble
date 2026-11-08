import type { BUN_SQLITE_COBBLE_CONTAINERS } from "@/db/types/db";
import inspectDockerContainer from "@/src/functions/backend/docker/inspect-docker-container";
import logEvent from "@/src/functions/backend/logger";
import refreshComputerContainer from "./refresh-computer-container";

type Params = {
    computer_id: number | string;
    container: Pick<BUN_SQLITE_COBBLE_CONTAINERS, "id" | "docker_id" | "status" | "ip_address">;
};

/**
 * A computer recorded as failed whose container docker runs anyway (a
 * setup that gave up while the container came up, or one an older version
 * marked failed when a new image couldn't be pulled) is recorded as
 * running again (`refreshComputerContainer`, which tells its owners).
 * Anything else stays failed, showing why, with Retry. Returns its state
 * when it came back, else null. Never throws.
 */
export default async function reviveFailedComputer({ computer_id, container }: Params) {
    if (!container.docker_id) return null;

    const state = await inspectDockerContainer({ container: container.docker_id }).catch(() => null);

    if (state?.status != "running") return null;

    const refreshed = await refreshComputerContainer({ computer_id, container }).catch(() => null);

    if (refreshed?.status != "running") return null;

    await logEvent({
        title: `Computer #${computer_id} is running again`,
        category: "system",
        plain_text: `Computer #${computer_id} was recorded as failed, but its container is running and healthy, so it's back in use.`,
        metadata: { computer_id },
    }).catch(() => {});

    return refreshed;
}
