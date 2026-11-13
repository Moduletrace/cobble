import BunSQLite from "@moduletrace/bun-sqlite";
import type { HarnessCallSettings, TokenUsageSummary } from "@/src/harness/usage/types";
import parseCallSettings from "@/src/utils/parse-call-settings";
import { isUnlimitedLimit, type RunLimit, UnlimitedLimit } from "@/src/utils/run-limit";
import toolRollup, { type ToolRollup } from "@/src/utils/tool-rollup";
import grabMessageUsage from "./grab-message-usage";

/**
 * The bounds a run worked under, as it reported them with each call
 * (`HarnessCallSettings.limits`): the steps it had, the prompt tokens it
 * may spend and the working context it sent per turn.
 */
export type RunUsageLimits = {
    steps: RunLimit | null;
    run_tokens: RunLimit | null;
    context_tokens: RunLimit | null;
};

/**
 * Today's General settings' run limits, for comparing a run with what the
 * install allows now.
 */
export type CurrentRunLimits = {
    task_steps: RunLimit;
    reply_steps: RunLimit;
    unattended_steps: RunLimit;
    run_tokens: RunLimit;
    context_tokens: RunLimit;
};

export type RunUsageCall = {
    id: number;
    created_at: number;
    harness: string;
    /**
     * The provider and model that answered, by the names they were called
     * with.
     */
    provider_name: string | null;
    model_slug: string | null;
    prompt_tokens: number;
    cached_tokens: number;
    completion_tokens: number;
    settings: HarnessCallSettings | null;
};

export type RunUsageMessage = {
    id: number;
    created_at: number;
    author: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    calls: number;
};

export type RunUsage = {
    /**
     * What was looked at: the open job (its message not written yet) or a
     * message already in the session.
     */
    target: {
        kind: "job" | "message";
        id: number;
        created_at: number | null;
        author: string | null;
        text: string | null;
    } | null;
    totals: TokenUsageSummary | null;
    calls: RunUsageCall[];
    /**
     * The tool calls the run made, counted by tool; null when it recorded
     * none.
     */
    tools: ToolRollup | null;
    /**
     * What bounded the run, from its own calls; null on a call recorded
     * before limits were.
     */
    limits: RunUsageLimits | null;
    current_limits: CurrentRunLimits;
};

type CallRow = {
    id: number;
    created_at: number;
    harness: string | null;
    provider_name: string | null;
    model_slug: string | null;
    prompt_tokens: number | null;
    cached_tokens: number | null;
    completion_tokens: number | null;
    settings: string | null;
};

type MessageRow = {
    id: number;
    created_at: number;
    author: string | null;
    text: string | null;
    tool_log: string | null;
};

const CallsSql = `SELECT t.id, t.created_at, t.harness, t.provider_name, t.model_slug,
        t.prompt_tokens, t.cached_tokens, t.completion_tokens, t.settings
    FROM token_usages t
    WHERE t.%COLUMN% = ?
    ORDER BY t.created_at ASC, t.id ASC
    LIMIT 500`;

const toCall = ({ row }: { row: CallRow }): RunUsageCall => ({
    id: Number(row.id),
    created_at: Number(row.created_at) || 0,
    harness: row.harness || "text",
    provider_name: row.provider_name || null,
    model_slug: row.model_slug || null,
    prompt_tokens: Number(row.prompt_tokens) || 0,
    cached_tokens: Number(row.cached_tokens) || 0,
    completion_tokens: Number(row.completion_tokens) || 0,
    settings: parseCallSettings({ json: row.settings }),
});

/**
 * The limits a run worked under, from the calls themselves: each call kept
 * what the loop let it spend, so a message read months later still says
 * which limit it ran into.
 */
const limitsOf = ({ calls }: { calls: RunUsageCall[] }): RunUsageLimits | null => {
    const limits = calls.find((call) => call.settings?.limits)?.settings?.limits;

    if (!limits) return null;

    const kept = (value: RunLimit | null | undefined): RunLimit | null =>
        typeof value == "number" ? value : isUnlimitedLimit(value) ? UnlimitedLimit : null;

    return {
        steps: kept(limits.steps),
        run_tokens: kept(limits.run_tokens),
        context_tokens: kept(limits.context_tokens),
    };
};

const totalsOf = ({ prompt_tokens, completion_tokens, cost, calls }: { prompt_tokens: number; completion_tokens: number; cost?: number; calls: number }): TokenUsageSummary => ({
    prompt_tokens,
    completion_tokens,
    total_tokens: prompt_tokens + completion_tokens,
    ...(cost && Number.isFinite(cost) ? { cost } : {}),
    calls,
});

/**
 * What one message (already checked to be in the run's own session) cost:
 * every model call it took with the settings each was made with, its tool
 * calls counted by tool, and the limits the run worked under. This is what
 * a bot reads to answer "why did that answer cost so much" before it
 * points the user at a setting (`read_message_usage`).
 */
export async function grabMessageRunUsage({
    message_id,
    session_id,
}: {
    message_id: number;
    session_id: number | string;
}) {
    const row = (
        await BunSQLite.sql<MessageRow>({
            sql: `SELECT id, created_at, author, text, tool_log FROM bot_messages WHERE id = ? AND session_id = ?`,
            values: [message_id, Number(session_id) || 0],
        })
    ).payload?.[0];

    if (!row) return null;

    const calls = (
        (await BunSQLite.sql<CallRow>({ sql: CallsSql.replace("%COLUMN%", "message_id"), values: [message_id] })).payload || []
    ).map((item) => toCall({ row: item }));
    const prompt_tokens = calls.reduce((total, call) => total + call.prompt_tokens, 0);
    const completion_tokens = calls.reduce((total, call) => total + call.completion_tokens, 0);

    return {
        target: {
            kind: "message" as const,
            id: Number(row.id),
            created_at: Number(row.created_at) || null,
            author: row.author || null,
            text: row.text || null,
        },
        totals: totalsOf({ prompt_tokens, completion_tokens, calls: calls.length }),
        calls,
        tools: toolRollup({ tool_log: row.tool_log }),
        limits: limitsOf({ calls }),
    };
}

/**
 * What a job that is still open has spent so far, from its own calls and
 * its recorded steps: a reply cannot look at itself through a message,
 * since that is written when it ends.
 */
export async function grabJobRunUsage({ job_id }: { job_id: number | string }) {
    const calls = (
        (await BunSQLite.sql<CallRow>({ sql: CallsSql.replace("%COLUMN%", "job_id"), values: [Number(job_id) || 0] })).payload || []
    ).map((item) => toCall({ row: item }));

    if (!calls.length) return null;

    const prompt_tokens = calls.reduce((total, call) => total + call.prompt_tokens, 0);
    const completion_tokens = calls.reduce((total, call) => total + call.completion_tokens, 0);

    return {
        target: { kind: "job" as const, id: Number(job_id) || 0, created_at: null, author: null, text: null },
        totals: totalsOf({ prompt_tokens, completion_tokens, calls: calls.length }),
        calls,
        tools: null,
        limits: limitsOf({ calls }),
    };
}

/**
 * The session's latest messages with what each cost, newest first, so a bot
 * can find the answer a user is asking about and then dig into it by id.
 */
export async function grabSessionMessageUsage({
    session_id,
    limit = 12,
}: {
    session_id: number | string;
    limit?: number;
}) {
    const rows =
        (
            await BunSQLite.sql<MessageRow>({
                sql: `SELECT id, created_at, author, text, tool_log FROM bot_messages
                    WHERE session_id = ? ORDER BY id DESC LIMIT ?`,
                values: [Number(session_id) || 0, Math.max(1, Math.min(40, limit))],
            })
        ).payload || [];

    if (!rows.length) return [];

    const totals = await grabMessageUsage({ message_ids: rows.map((row) => Number(row.id)) });

    return rows.map((row) => {
        const usage = totals.get(Number(row.id));

        return {
            id: Number(row.id),
            created_at: Number(row.created_at) || 0,
            author: row.author || "assistant",
            prompt_tokens: usage?.prompt_tokens || 0,
            completion_tokens: usage?.completion_tokens || 0,
            total_tokens: usage?.total_tokens || 0,
            calls: usage?.calls || 0,
        } satisfies RunUsageMessage;
    });
}