import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CONTAINERS,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { ComputerMcpPath, type ContainerStatus } from "@/src/dict/computer-dict";
import computerToken from "@/src/utils/computer-token";
import AppError from "@/src/utils/app-error";
import grabEnv from "../envs/grab-env";
import pickReachableAddress from "./pick-reachable-address";
import refreshComputerContainer from "./refresh-computer-container";
import reviveFailedComputer from "./revive-failed-computer";

type Params = {
    computer_id: number | string;
};

export type SshTarget = {
    host: string;
    port: number;
    username: string;
    home: string | null;
    fingerprint: string | null;
};

export type ComputerAddress =
    | {
          ready: true;
          connection: "docker";
          url: string;
          base_url: string;
          token: string;
          name: string;
      }
    | {
          ready: true;
          connection: "ssh";
          name: string;
          ssh: SshTarget;
      }
    | {
          ready: false;
          status: ContainerStatus;
          name: string;
      };

type ComputerRow = Pick<
    BUN_SQLITE_COBBLE_COMPUTERS,
    | "name"
    | "kind"
    | "connection"
    | "ssh_host"
    | "ssh_port"
    | "ssh_user"
    | "ssh_home"
    | "ssh_fingerprint"
> &
    Pick<
        BUN_SQLITE_COBBLE_CONTAINERS,
        "id" | "docker_id" | "status" | "hostname" | "ip_address" | "port"
    >;

/**
 * Returns connection coordinates for a computer: an SSH target for an SSH
 * server, or Docker HTTP / MCP address for a container.
 */
export default async function grabComputerTarget({
    computer_id,
}: Params): Promise<ComputerAddress | null> {
    const row = (
        await BunSQLite.sql<ComputerRow>({
            sql: `SELECT co.name, co.kind, co.connection, co.ssh_host, co.ssh_port,
                         co.ssh_user, co.ssh_home, co.ssh_fingerprint,
                         c.id, c.docker_id, c.status, c.hostname, c.ip_address, c.port
                  FROM computers co
                  LEFT JOIN containers c ON c.id = co.container_id
                  WHERE co.id = ? LIMIT 1`,
            values: [computer_id],
        })
    ).payload?.[0];

    if (!row) return null;
    const name = row.name || "";

    if (row.connection === "ssh") {
        if (!row.ssh_host || !row.ssh_user) {
            throw new AppError("This SSH computer has no host or user configured.");
        }
        return {
            ready: true,
            connection: "ssh",
            name,
            ssh: {
                host: row.ssh_host,
                port: row.ssh_port || 22,
                username: row.ssh_user,
                home: row.ssh_home || null,
                fingerprint: row.ssh_fingerprint || null,
            },
        };
    }

    if (!row.hostname) return null;

    const main_override =
        row.kind == "main"
            ? (await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim()
            : undefined;

    if (main_override) {
        const base_url = main_override.replace(/\/+$/, "");
        return {
            ready: true,
            connection: "docker",
            url: `${base_url}${ComputerMcpPath}`,
            base_url,
            token: computerToken({ computer_id }),
            name,
        };
    }

    let status = (row.status || "unknown") as ContainerStatus;
    let ip_address: string | null | undefined = row.ip_address;

    const revived =
        status == "failed"
            ? await reviveFailedComputer({ computer_id, container: row })
            : null;

    if (revived) {
        ({ status, ip_address } = revived);
    } else if (
        status != "running" &&
        status != "creating" &&
        status != "failed"
    ) {
        const refreshed = await refreshComputerContainer({
            computer_id,
            container: row,
        });
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

    return {
        ready: true,
        connection: "docker",
        url: `${base_url}${ComputerMcpPath}`,
        base_url,
        token: computerToken({ computer_id }),
        name,
    };
}
