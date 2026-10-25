import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number | string;
};

/**
 * Whether a job is working on the computer right now, so its browser or
 * container must not be pulled from under it.
 */
export default async function isComputerBusy({ computer_id }: Params) {
    return Boolean(
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM bots_queue WHERE computer_id = ? AND status = 'processing' LIMIT 1`,
                values: [computer_id],
            })
        ).payload?.[0],
    );
}
