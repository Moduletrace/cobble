import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_TOKEN_USAGES,
    BunSQLiteTables,
} from "@/db/types/db";
import { logError } from "@/src/functions/backend/logger";
import { grabHarnessUsageScope } from "./harness-usage-scope";
import type { HarnessUsageCall, HarnessUsageScope } from "./types";

type Params = {
    /**
     * The scope the call ran under. Left out, the ambient one
     * (`grabHarnessUsageScope`) is used, which is what every entry point
     * does: the ids came in through `runWithHarnessUsageScope`.
     */
    scope?: HarnessUsageScope;
    /**
     * Which harness and which model answered, with what the provider
     * reported it cost.
     */
    call: HarnessUsageCall;
};

/**
 * Writes one model call into `token_usages`: the tokens it spent, on which
 * model and provider, for whom, and which message or job it was for. This
 * is what a message's token line, a bot's and a provider's totals and the
 * usage page all read.
 *
 * Never throws: a model that answered must not have its answer lost
 * because the bookkeeping failed. A call without an owner (no scope, no
 * user) is not written at all, since nothing could show it.
 */
export default async function recordHarnessUsage({ scope, call }: Params) {
    const resolved = scope || grabHarnessUsageScope();
    const user_id = Number(resolved?.user_id) || null;

    if (!user_id) return;

    const row: BUN_SQLITE_COBBLE_TOKEN_USAGES = {
        user_id,
        bot_id: numberOrNull(resolved?.bot_id),
        workspace_id: numberOrNull(resolved?.workspace_id),
        session_id: numberOrNull(resolved?.session_id),
        message_id: numberOrNull(resolved?.message_id),
        job_id: numberOrNull(resolved?.job_id),
        harness: call.harness,
        provider_id: call.provider_id,
        provider_name: call.provider_name,
        model_id: call.model_id,
        model_slug: call.model_slug,
        prompt_tokens: Math.max(0, Math.round(call.prompt_tokens || 0)),
        completion_tokens: Math.max(0, Math.round(call.completion_tokens || 0)),
        cost: typeof call.cost == "number" && Number.isFinite(call.cost) ? call.cost : undefined,
        settings: call.settings ? JSON.stringify(call.settings) : undefined,
    };

    try {
        const res = await BunSQLite.insert<
            BUN_SQLITE_COBBLE_TOKEN_USAGES,
            (typeof BunSQLiteTables)[number]
        >({
            table: "token_usages",
            data: [row],
        });

        if (!res.success) {
            throw new Error(res.msg || `The usage wasn't saved.`);
        }
    } catch (error: unknown) {
        await logError({
            title: "Model usage not recorded",
            error,
            metadata: {
                harness: call.harness,
                model_slug: call.model_slug || null,
                provider_name: call.provider_name || null,
                user_id,
            },
        }).catch(() => {});
    }
}

/**
 * SQLite stores NULL for what isn't given; `Number(undefined)` is NaN,
 * which bun-sqlite would refuse. An absent id is `undefined`, not `null`:
 * bun-sqlite's row types spell "no value" that way.
 */
function numberOrNull(value: unknown): number | undefined {
    const number = Number(value);

    return Number.isFinite(number) && number > 0 ? number : undefined;
}
