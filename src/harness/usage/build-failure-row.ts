import type { BUN_SQLITE_COBBLE_HARNESS_CALL_FAILURES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import candidateModelId from "./candidate-model-id";
import type { HarnessUsageCall, HarnessUsageScope } from "./types";

type Params = {
    harness: HarnessUsageCall["harness"];
    candidate: HarnessCandidate;
    error: HarnessError;
    rests_until?: number;
    scope?: HarnessUsageScope;
};

/**
 * The `harness_call_failures` row for one failed model call, attributed
 * like a usage row. Null without an owner: nothing could show it.
 */
export default function buildFailureRow({
    harness,
    candidate,
    error,
    rests_until,
    scope,
}: Params): BUN_SQLITE_COBBLE_HARNESS_CALL_FAILURES | null {
    const user_id = idOf(scope?.user_id);

    if (!user_id) return null;

    return {
        user_id,
        bot_id: idOf(scope?.bot_id),
        workspace_id: idOf(scope?.workspace_id),
        session_id: idOf(scope?.session_id),
        message_id: idOf(scope?.message_id),
        job_id: idOf(scope?.job_id),
        harness,
        provider_id: candidate.provider.id,
        provider_name: candidate.provider.name || candidate.provider.kind,
        model_id: candidateModelId({ candidate }),
        model_slug: candidate.model.slug,
        source: candidate.source,
        status: typeof error.status == "number" ? error.status : undefined,
        error: (error.message || "Unknown error").slice(0, AppData.HarnessFailureErrorMaxChars),
        rests_until,
    };
}

/**
 * An absent id is `undefined`, never NaN, which bun-sqlite would refuse.
 */
function idOf(value: unknown): number | undefined {
    const number = Number(value);

    return Number.isFinite(number) && number > 0 ? number : undefined;
}
