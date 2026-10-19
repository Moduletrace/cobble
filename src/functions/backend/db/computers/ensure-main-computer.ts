import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CONTAINERS,
    BunSQLiteTables,
} from "@/db/types/db";
import { MainComputerName } from "@/src/dict/computer-dict";
import grabEnv from "../envs/grab-env";
import createComputer from "./create-computer";
import provisionComputer from "./provision-computer";

type Params = {
    user_id: number | string;
    /**
     * The owner's coordinator (from `ensureCoordinatorBot`). It always has
     * access to the main computer.
     */
    coordinator_id: number | string;
    /**
     * Wait for a container being set up (a CLI script, which would
     * otherwise exit first).
     */
    wait?: boolean;
};

/**
 * Returns the id of the user's main computer, creating it first if
 * missing (`createComputer`, which sets its container up in the
 * background), and makes sure the coordinator has access to it. A main
 * computer recorded before the app managed containers (no docker id, no
 * `MAIN_COMPUTER_URL`) gets its container set up now. Safe to call on
 * every visit.
 */
export default async function ensureMainComputer({
    user_id,
    coordinator_id,
    wait,
}: Params) {
    const existing = (
        await BunSQLite.select<
            BUN_SQLITE_COBBLE_COMPUTERS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "computers",
            query: {
                query: {
                    user_id: { value: user_id },
                    kind: { value: "main" },
                },
                order: { field: "id", strategy: "ASC" },
                limit: 1,
            },
        })
    ).payload?.[0];

    let computer_id = existing?.id ? Number(existing.id) : 0;
    let provisioning: Promise<void> = Promise.resolve();

    if (!computer_id) {
        const created = await createComputer({ user_id, name: MainComputerName, kind: "main" });

        computer_id = created.computer_id;
        provisioning = created.provisioning;
    } else if (await needsContainer({ container_id: existing?.container_id })) {
        provisioning = provisionComputer({ computer_id });
    }

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_computers (bot_id, computer_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        values: [coordinator_id, computer_id, Date.now(), Date.now()],
    });

    if (wait) await provisioning;

    return computer_id;
}

async function needsContainer({ container_id }: { container_id?: number | "" }) {
    if ((await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim()) return false;

    const container = container_id
        ? (
              await BunSQLite.sql<BUN_SQLITE_COBBLE_CONTAINERS>({
                  sql: `SELECT docker_id, status FROM containers WHERE id = ? LIMIT 1`,
                  values: [container_id],
              })
          ).payload?.[0]
        : null;

    return Boolean(container && !container.docker_id && container.status == "unknown");
}
