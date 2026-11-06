import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import grabComputerMcpUrl from "../db/computers/grab-computer-mcp-url";
import runComputerCommand from "./run-computer-command";

type Params = {
    bot_id: number | string;
    /**
     * The jobs just stopped: the computers they worked on.
     */
    jobs: Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "computer_id">[];
};

/**
 * After a worker is stopped, ends what it left running on the computers
 * those jobs worked on (`nohup ... &`): every process of its own account
 * there (`kill -KILL -1` as that account reaches nothing else). Skipped on
 * a computer where another run of the bot is still working (another
 * user's). Best effort: a computer that can't be reached keeps them until
 * it's restarted.
 */
export default async function endWorkerProcesses({ bot_id, jobs }: Params) {
    const computer_ids = [...new Set(jobs.map((job) => Number(job.computer_id)).filter((id) => id > 0))];

    for (const computer_id of computer_ids) {
        const working = await BunSQLite.sql<{ n: number }>({
            sql: `SELECT COUNT(*) AS n FROM bots_queue WHERE bot_id = ? AND computer_id = ? AND status = 'processing'`,
            values: [Number(bot_id), computer_id],
        });

        if (Number(working.payload?.[0]?.n) > 0) continue;

        const computer = await grabComputerMcpUrl({ computer_id }).catch(() => null);

        if (!computer?.ready) continue;

        await runComputerCommand({
            computer,
            command: "kill -KILL -1 2>/dev/null; true",
            timeout_ms: 15_000,
            run_as: { bot_id: Number(bot_id), workspace_id: null },
        }).catch(() => undefined);
    }
}
