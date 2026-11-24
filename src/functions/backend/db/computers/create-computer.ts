import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CONTAINERS,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { ComputerConnection, ComputerKind } from "@/src/dict/computer-dict";
import grabComputerTarget from "./grab-computer-target";
import AppError from "@/src/utils/app-error";
import grabEnv from "../envs/grab-env";
import provisionComputer from "./provision-computer";
import ensureSshHome from "@/src/functions/backend/computers/ssh/ensure-ssh-home";

type Params = {
    /**
     * Who creates it. Computers belong to the install.
     */
    user_id: number | string;
    name: string;
    description?: string;
    /**
     * `main` only for the install's one main computer (`ensureMainComputer`).
     */
    kind?: ComputerKind;
    /**
     * A docker computer runs a container here; an SSH server is reached at
     * `ssh` with the install-wide key.
     */
    connection?: ComputerConnection;
    ssh?: {
        host: string;
        port?: number;
        user: string;
    };
    /**
     * CPU cores its container may use. Defaults to `AppData.ComputerDefaultCpus`.
     */
    cpus?: number;
    /**
     * Its container's memory limit in MB. Defaults to
     * `AppData.ComputerDefaultMemoryMb`.
     */
    memory_mb?: number;
};

/**
 * Records a new computer and its container
 * (`<AppData.ComputerContainerPrefix>-<id>`), then sets the container up
 * in the background (`provisionComputer`). Returns the computer at once,
 * still `creating`, and the setup to await when the caller must (a CLI
 * script). Its resources (`cpus`, `memory_mb`) are saved on the computer
 * and applied to its container whenever it is set up. The main computer of a server that reaches it at
 * `MAIN_COMPUTER_URL` (a dev server) gets no container of its own.
 *
 * An SSH computer gets no container: it is checked once (the key signs in
 * and the home directory is learned), and the row is kept only if that
 * works.
 */
export default async function createComputer({
    user_id,
    name,
    description,
    kind = "sandbox",
    connection = "docker",
    ssh,
    cpus = AppData.ComputerDefaultCpus,
    memory_mb = AppData.ComputerDefaultMemoryMb,
}: Params) {
    if (connection == "ssh") {
        if (!ssh?.host || !ssh?.user) {
            throw new AppError("An SSH server needs a host and the user to sign in as.");
        }

        const computer_res = await BunSQLite.insert<
            BUN_SQLITE_COBBLE_COMPUTERS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "computers",
            data: [
                {
                    user_id: Number(user_id),
                    name,
                    description: description || undefined,
                    kind,
                    connection: "ssh",
                    ssh_host: ssh.host,
                    ssh_port: ssh.port || 22,
                    ssh_user: ssh.user,
                },
            ],
        });

        const computer_id = computer_res.singleRes?.id || computer_res.postInsertReturn?.insertId;

        if (!computer_res.success || !computer_id) {
            throw new Error(`Couldn't create the computer: ${computer_res.msg}`);
        }

        try {
            const target = await grabComputerTarget({ computer_id });

            if (!target?.ready || target.connection !== "ssh") {
                throw new AppError("This SSH server has no host or user configured.");
            }

            await ensureSshHome({ computer: { ssh: target.ssh, computer_id: Number(computer_id) } });
        } catch (error) {
            /**
             * A server it can't reach is no computer: keep no half-made row.
             */
            await BunSQLite.sql({ sql: `DELETE FROM computers WHERE id = ?`, values: [computer_id] });
            throw error;
        }

        return { computer_id: Number(computer_id), provisioning: Promise.resolve() };
    }

    const external = kind == "main" && Boolean((await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim());

    const container_res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_CONTAINERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "containers",
        data: [
            {
                name: `${AppData.ComputerContainerPrefix}-pending-${Date.now()}`,
                purpose: "computer",
                network: AppData.DockerNetworkName,
                port: AppData.ComputerPort,
                image: AppData.ComputerImage,
                status: external ? "unknown" : "creating",
            },
        ],
    });

    const container_id = container_res.singleRes?.id || container_res.postInsertReturn?.insertId;

    if (!container_res.success || !container_id) {
        throw new Error(`Couldn't record the computer's container: ${container_res.msg}`);
    }

    const computer_res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_COMPUTERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "computers",
        data: [
            {
                user_id: Number(user_id),
                container_id: Number(container_id),
                name,
                description: description || undefined,
                kind,
                connection: "docker",
                cpus,
                memory_mb,
            },
        ],
    });

    const computer_id = computer_res.singleRes?.id || computer_res.postInsertReturn?.insertId;

    if (!computer_res.success || !computer_id) {
        await BunSQLite.sql({ sql: `DELETE FROM containers WHERE id = ?`, values: [container_id] });
        throw new Error(`Couldn't create the computer: ${computer_res.msg}`);
    }

    const container_name = `${AppData.ComputerContainerPrefix}-${computer_id}`;

    await BunSQLite.sql({
        sql: `UPDATE containers SET name = ?, hostname = ? WHERE id = ?`,
        values: [container_name, container_name, container_id],
    });

    const provisioning = external
        ? Promise.resolve()
        : provisionComputer({ computer_id: Number(computer_id), fresh: true });

    return { computer_id: Number(computer_id), provisioning };
}