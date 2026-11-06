import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_INSTALL_REQUESTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";

type Params = {
    request_id: number | string;
    /**
     * The coordinator's job answering it: only that job's run may.
     */
    job_id: number | string;
    outcome: "installed" | "refused";
    note: string;
};

/**
 * The coordinator's answer to an install request, once, by the run it was
 * given to. The worker hears it when that run ends
 * (`settleInstallRequest`). Returns the request, or null when it was
 * already answered or isn't this job's.
 */
export default async function answerInstallRequest({ request_id, job_id, outcome, note }: Params) {
    const now = Date.now();
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_INSTALL_REQUESTS>({
        sql: `UPDATE install_requests SET status = ?, answer = ?, decided_at = ?, updated_at = ?
            WHERE id = ? AND job_id = ? AND status = 'pending'
            RETURNING *`,
        values: [outcome, note.trim().slice(0, AppData.InstallRequestAnswerMaxChars), now, now, Number(request_id), Number(job_id)],
    });

    return res.payload?.[0] || null;
}
