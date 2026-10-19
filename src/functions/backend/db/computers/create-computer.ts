import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CONTAINERS,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { ComputerKind } from "@/src/dict/computer-dict";
import grabEnv from "../envs/grab-env";
import provisionComputer from "./provision-computer";

type Params = {
    user_id: number | string;
    name: string;
    description?: string;
    /**
     * `main` only for the owner's one main computer (`ensureMainComputer`).
     */
    kind?: ComputerKind;
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
 * Records a new computer for the user and its container
 * (`<AppData.ComputerContainerPrefix>-<id>`), then sets the container up
 * in the background (`provisionComputer`). Returns the computer at once,
 * still `creating`, and the setup to await when the caller must (a CLI
 * script). Its resources (`cpus`, `memory_mb`) are saved on the computer
 * and applied to its container whenever it is set up. The main computer of a server that reaches it at
 * `MAIN_COMPUTER_URL` (a dev server) gets no container of its own.
 */
export default async function createComputer({
    user_id,
    name,
    description,
    kind = "sandbox",
    cpus = AppData.ComputerDefaultCpus,
    memory_mb = AppData.ComputerDefaultMemoryMb,
}: Params) {
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
