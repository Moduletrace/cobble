import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_CONTAINERS,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";

/**
 * Returns the id of the main computer's container record, creating it if
 * missing. The container itself is created at install, named
 * `AppData.MainComputerContainerName` on the `AppData.DockerNetworkName`
 * network; this only records it. Safe to call on every visit.
 */
export default async function ensureMainComputerContainer() {
    const name = AppData.MainComputerContainerName;

    const existing = (
        await BunSQLite.select<
            BUN_SQLITE_COBBLE_CONTAINERS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "containers",
            query: {
                query: {
                    name: { value: name },
                },
                limit: 1,
            },
        })
    ).payload?.[0];

    if (existing?.id) {
        return existing.id;
    }

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_CONTAINERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "containers",
        data: [
            {
                name,
                purpose: "computer",
                network: AppData.DockerNetworkName,
                hostname: name,
                port: AppData.ComputerPort,
                status: "unknown",
            },
        ],
    });

    const container_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !container_id) {
        throw new Error(`Couldn't record the main computer's container: ${res.msg}`);
    }

    return container_id;
}
