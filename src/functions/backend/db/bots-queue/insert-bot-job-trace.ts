import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_JOB_TRACES, BunSQLiteTables } from "@/db/types/db";
import prepareTrace from "@/src/harness/trace/prepare-trace";
import redactTrace from "@/src/harness/trace/redact-trace";
import type { HarnessTrace } from "@/src/harness/trace/types";
import redactSecrets from "@/src/utils/redact-secrets";

type Params = {
    job_id: number;
    bot_id: number;
    session_id: number | null;
    trace: HarnessTrace;
    /**
     * Every secret the run reaches (`grabReachableEnvs`): a bot's tool
     * arguments and results carry whatever it handled, and a trace is read
     * by the user (and super admins) long after.
     */
    secrets?: { key: string; value: string }[];
};

/**
 * Records one trace entry of a running job (`bot_job_traces`) and returns
 * the row. Text is redacted and cut before it is written, never after.
 */
export default async function insertBotJobTrace({
    job_id,
    bot_id,
    session_id,
    trace,
    secrets = [],
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_JOB_TRACES> {
    const prepared = prepareTrace({
        trace: redactTrace({
            trace,
            redact: (text) => redactSecrets({ text, secrets }),
        }),
    });

    const row: BUN_SQLITE_COBBLE_BOT_JOB_TRACES = {
        bots_queue_id: job_id,
        bot_id,
        session_id: session_id ?? undefined,
        kind: prepared.kind,
        name: prepared.name ?? undefined,
        text: prepared.text ?? undefined,
        reasoning: prepared.reasoning ?? undefined,
        arguments: prepared.arguments ?? undefined,
        result: prepared.result ?? undefined,
        metadata: prepared.metadata ?? undefined,
    };

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_JOB_TRACES, (typeof BunSQLiteTables)[number]>({
        table: "bot_job_traces",
        data: [row],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Failed to save the job trace: ${res.msg}`);
    }

    return { ...row, id, created_at: Date.now() };
}