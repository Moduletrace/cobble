import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BunSQLiteTables,
} from "@/db/types/db";
import { MainComputerName } from "@/src/dict/computer-dict";
import ensureMainComputerContainer from "./ensure-main-computer-container";

type Params = {
    user_id: number | string;
    /**
     * The owner's coordinator (from `ensureCoordinatorBot`). It always has
     * access to the main computer.
     */
    coordinator_id: number | string;
};

/**
 * Returns the id of the user's main computer, recording it (and its
 * container) first if missing, and makes sure the coordinator has access
 * to it. Safe to call on every visit.
 */
export default async function ensureMainComputer({
    user_id,
    coordinator_id,
}: Params) {
    const computer_id = await grabOrCreateMainComputer({ user_id });

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_computers (bot_id, computer_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        values: [coordinator_id, computer_id, Date.now(), Date.now()],
    });

    return computer_id;
}

async function grabOrCreateMainComputer({
    user_id,
}: Pick<Params, "user_id">) {
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

    if (existing?.id) {
        return existing.id;
    }

    const container_id = await ensureMainComputerContainer();

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_COMPUTERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "computers",
        data: [
            {
                user_id: Number(user_id),
                container_id: Number(container_id),
                name: MainComputerName,
                kind: "main",
            },
        ],
    });

    const computer_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !computer_id) {
        throw new Error(`Couldn't create the main computer: ${res.msg}`);
    }

    return computer_id;
}
