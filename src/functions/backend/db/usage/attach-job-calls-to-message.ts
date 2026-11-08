import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    job_id: number;
    message_id: number;
};

/**
 * A job's model calls are written down as they happen, before its message
 * exists. Once the job posts one (its answer, or the failure notice), the
 * calls that answered (`token_usages`) and the ones that failed
 * (`harness_call_failures`) belong to it, so its details show what it
 * cost and which models failed and why. Never throws.
 */
export default async function attachJobCallsToMessage({ job_id, message_id }: Params) {
    for (const table of ["token_usages", "harness_call_failures"]) {
        await BunSQLite.sql({
            sql: `UPDATE ${table} SET message_id = ? WHERE job_id = ? AND message_id IS NULL`,
            values: [message_id, job_id],
        }).catch(() => {});
    }
}
