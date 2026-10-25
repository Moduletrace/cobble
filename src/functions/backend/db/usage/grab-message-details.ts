import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { MessageDetails, MessageDetailsCall, MessageDetailsJob } from "@/src/types";
import groupMessageCalls from "@/src/utils/group-message-calls";
import parseCallSettings from "@/src/utils/parse-call-settings";
import grabMessageUsage from "./grab-message-usage";

type Params = {
    /**
     * A message the caller already checked the user reaches.
     */
    message_id: number;
    created_at?: number | null;
};

type CallRow = {
    id: number;
    created_at: number;
    harness: string | null;
    provider_id: number | null;
    provider_name: string | null;
    provider_kind: string | null;
    model_slug: string | null;
    model_name: string | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    cost: number | null;
    settings: string | null;
    job_id: number | null;
};

type JobRow = {
    id: number;
    kind: string | null;
    title: string | null;
    status: string | null;
    attempts: number | null;
    started_at: number | null;
    finished_at: number | null;
    steps: number | null;
};

/**
 * How one message was generated: every model call it took (`token_usages`)
 * with the provider and model that answered, summed per model, and the
 * queued job that ran it, while it is kept. The provider's kind and the
 * model's display name come from their live rows, so a deleted provider
 * or an unlisted model still reads by the name it was called with.
 */
export default async function grabMessageDetails({ message_id, created_at }: Params): Promise<MessageDetails> {
    const rows =
        (
            await BunSQLite.sql<CallRow>({
                sql: `SELECT t.id, t.created_at, t.harness, t.provider_id, t.provider_name,
                        p.kind AS provider_kind, t.model_slug, m.name AS model_name,
                        t.prompt_tokens, t.completion_tokens, t.cost, t.settings, t.job_id
                    FROM token_usages t
                    LEFT JOIN harness_providers p ON p.id = t.provider_id
                    LEFT JOIN harness_models m ON m.id = t.model_id
                    WHERE t.message_id = ?
                    ORDER BY t.created_at ASC, t.id ASC`,
                values: [message_id],
            })
        ).payload || [];

    const calls: MessageDetailsCall[] = rows.map((row) => ({
        id: Number(row.id),
        created_at: Number(row.created_at) || 0,
        harness: row.harness || "text",
        provider_id: row.provider_id ? Number(row.provider_id) : null,
        provider_name: row.provider_name || null,
        provider_kind: row.provider_kind || null,
        model_slug: row.model_slug || null,
        model_name: row.model_name || null,
        prompt_tokens: Number(row.prompt_tokens) || 0,
        completion_tokens: Number(row.completion_tokens) || 0,
        cost: Number.isFinite(Number(row.cost)) && row.cost !== null ? Number(row.cost) : null,
        settings: parseCallSettings({ json: row.settings }),
    }));

    const totals = (await grabMessageUsage({ message_ids: [message_id] })).get(message_id) || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        calls: 0,
    };

    /**
     * The job is the one its calls ran for: the latest, since reading a
     * message aloud later is a call without one.
     */
    const job_id = [...rows].reverse().find((row) => row.job_id)?.job_id;

    return {
        message_id,
        created_at: created_at || null,
        totals,
        models: groupMessageCalls({ calls }),
        calls: calls.slice(0, AppData.MessageDetailsMaxCalls),
        job: job_id ? await grabJob({ job_id: Number(job_id) }) : null,
    };
}

async function grabJob({ job_id }: { job_id: number }): Promise<MessageDetailsJob | null> {
    const row = (
        await BunSQLite.sql<JobRow>({
            sql: `SELECT q.id, q.kind, q.title, q.status, q.attempts, q.started_at, q.finished_at,
                    (SELECT COUNT(*) FROM bots_queue_updates u WHERE u.bots_queue_id = q.id) AS steps
                FROM bots_queue q WHERE q.id = ? LIMIT 1`,
            values: [job_id],
        })
    ).payload?.[0];

    if (!row?.id) return null;

    return {
        id: Number(row.id),
        kind: row.kind || null,
        title: row.title || null,
        status: row.status || null,
        attempts: Number(row.attempts) || 0,
        started_at: Number(row.started_at) || null,
        finished_at: Number(row.finished_at) || null,
        steps: Number(row.steps) || 0,
    };
}
