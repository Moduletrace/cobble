import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_HARNESS_CALL_FAILURES,
    BunSQLiteTables,
} from "@/db/types/db";
import { logError } from "@/src/functions/backend/logger";
import type HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import buildFailureRow from "./build-failure-row";
import { grabHarnessUsageScope } from "./harness-usage-scope";
import type { HarnessUsageCall, HarnessUsageScope } from "./types";

type Params = {
    harness: HarnessUsageCall["harness"];
    candidate: HarnessCandidate;
    error: HarnessError;
    /**
     * Unix ms it may be tried again, if the failure benched it.
     */
    rests_until?: number;
    /**
     * Left out, the ambient scope (`grabHarnessUsageScope`) is used.
     */
    scope?: HarnessUsageScope;
};

/**
 * Writes one failed model call into `harness_call_failures`, so the
 * message its job posts can show which models failed and why. A call
 * without an owner isn't written.
 *
 * Never throws: bookkeeping must not change how the call goes on.
 */
export default async function recordHarnessFailure({ harness, candidate, error, rests_until, scope }: Params) {
    const row = buildFailureRow({
        harness,
        candidate,
        error,
        rests_until,
        scope: scope || grabHarnessUsageScope(),
    });

    if (!row) return;

    try {
        const res = await BunSQLite.insert<
            BUN_SQLITE_COBBLE_HARNESS_CALL_FAILURES,
            (typeof BunSQLiteTables)[number]
        >({
            table: "harness_call_failures",
            data: [row],
        });

        if (!res.success) {
            throw new Error(res.msg || `The failed call wasn't saved.`);
        }
    } catch (save_error: unknown) {
        await logError({
            title: "Failed model call not recorded",
            category: "llm",
            error: save_error,
            metadata: { harness, model_slug: candidate.model.slug, user_id: row.user_id },
        }).catch(() => {});
    }
}
