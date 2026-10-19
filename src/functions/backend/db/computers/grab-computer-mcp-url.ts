import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CONTAINERS,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { ComputerMcpPath, type ContainerStatus } from "@/src/dict/computer-dict";
import grabEnv from "../envs/grab-env";
import pickReachableAddress from "./pick-reachable-address";
import refreshComputerContainer from "./refresh-computer-container";

type Params = {
    computer_id: number | string;
};

type ComputerRow = Pick<BUN_SQLITE_COBBLE_COMPUTERS, "name" | "kind"> &
    Pick<BUN_SQLITE_COBBLE_CONTAINERS, "id" | "docker_id" | "status" | "hostname" | "ip_address" | "port">;

export type ComputerAddress =
    | { ready: true; url: string; base_url: string; name: string }
    | { ready: false; status: ContainerStatus; name: string };

/**
 * Where a computer's MCP server answers: `MAIN_COMPUTER_URL` for the
 * main computer (an app setting, `grabEnv`: for a server outside docker,
 * e.g. `http://localhost:8170`), else its docker hostname and port, or
 * its IP address on the network when the hostname can't be reached (a
 * dev server outside docker, `pickReachableAddress`). `base_url` is the
 * same address without `/mcp`, for the sandbox's REST API. Only a
 * computer whose health check passed (`running`) is reached; any other
 * state is read again from docker first, since it may have come back
 * since the last sync, and returned as `ready: false`. Null when the
 * computer has no container.
 */
export default async function grabComputerMcpUrl({ computer_id }: Params): Promise<ComputerAddress | null> {
    const row = (
        await BunSQLite.sql<ComputerRow>({
            sql: `SELECT co.name, co.kind, c.id, c.docker_id, c.status, c.hostname, c.ip_address, c.port
                FROM computers co JOIN containers c ON c.id = co.container_id
                WHERE co.id = ? LIMIT 1`,
            values: [computer_id],
        })
    ).payload?.[0];

    if (!row?.hostname) return null;

    const name = row.name || "";

    const main_override = row.kind == "main"
        ? (await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim()
        : undefined;

    if (main_override) {
        const base_url = main_override.replace(/\/+$/, "");
        return { ready: true, url: `${base_url}${ComputerMcpPath}`, base_url, name };
    }

    let status = (row.status || "unknown") as ContainerStatus;
    let ip_address: string | null | undefined = row.ip_address;

    if (status != "running" && status != "creating" && status != "failed") {
        const refreshed = await refreshComputerContainer({ computer_id, container: row });

        if (refreshed) ({ status, ip_address } = refreshed);
    }

    if (status != "running") return { ready: false, status, name };

    const port = row.port || AppData.ComputerPort;

    const base_url = await pickReachableAddress({
        key: `computer:${computer_id}`,
        candidates: [
            `http://${row.hostname}:${port}`,
            ...(ip_address ? [`http://${ip_address}:${port}`] : []),
        ],
    });

    return { ready: true, url: `${base_url}${ComputerMcpPath}`, base_url, name };
}
