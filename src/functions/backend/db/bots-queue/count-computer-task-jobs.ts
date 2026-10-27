import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number | string;
    /**
     * Left out of the count, e.g. the job just queued.
     */
    except_job_id?: number | string | null;
};

/**
 * How many tasks are queued or working on a computer (any bot's, any
 * user's). Tasks run one at a time per computer, so a new one waits for
 * all of them.
 */
export default async function countComputerTaskJobs({ computer_id, except_job_id }: Params) {
    const res = await BunSQLite.sql<{ n: number }>({
        sql: `SELECT COUNT(*) AS n FROM bots_queue
            WHERE computer_id = ? AND kind = 'task' AND status IN ('pending', 'processing') AND id != ?`,
        values: [Number(computer_id), Number(except_job_id) || 0],
    });

    return Number(res.payload?.[0]?.n) || 0;
}
