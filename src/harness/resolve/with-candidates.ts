import { AppData } from "@/src/data/app-data";
import { Harnesses, type HarnessKind } from "@/src/dict/harness-dict";
import HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import type { HarnessCooldowns } from "./create-cooldowns";
import DefaultCooldowns from "./harness-cooldowns";

type Params<T> = {
    harness: HarnessKind;
    candidates: HarnessCandidate[];
    run: (candidate: HarnessCandidate) => Promise<T>;
    /**
     * Tried first when it's a candidate: the model a multi-step run already
     * uses, so it doesn't switch models mid-task without a reason.
     */
    prefer_key?: string;
    /**
     * Called with what the candidate that worked returned, before the call
     * comes back to the caller: where a harness writes its usage down.
     * Never fails the call (the caller passes a recorder that can't throw).
     */
    on_success?: (params: {
        candidate: HarnessCandidate;
        result: T;
    }) => Promise<void> | void;
    cooldowns?: HarnessCooldowns;
    now?: () => number;
};

/**
 * Bad keys and missing credits keep a provider out this long.
 */
const ProviderCooldownMs = 10 * 60 * 1000;
/**
 * A model the provider no longer has (404) or won't serve to us (403)
 * stays out this long.
 */
const GoneCooldownMs = 60 * 60 * 1000;

/**
 * Runs a harness call on the first candidate that works, in order (the
 * preferred one first), up to `AppData.HarnessMaxCandidates` tries.
 * Candidates (and providers) on cooldown are skipped; a failure puts its
 * candidate, or its whole provider for a key problem, on cooldown.
 *
 * Throws a `HarnessError`: `unavailable` when there is nothing to try,
 * otherwise the last failure, `retryable` if any failure was.
 */
export default async function withCandidates<T>({
    harness,
    candidates,
    run,
    prefer_key,
    on_success,
    cooldowns = DefaultCooldowns,
    now = Date.now,
}: Params<T>): Promise<{ result: T; candidate: HarnessCandidate }> {
    const title = Harnesses.find((h) => h.value == harness)?.title || harness;

    if (!candidates.length) {
        throw new HarnessError({
            message: `No ${title.toLowerCase()} model is set up. A super admin can pick one in Settings, under Models.`,
            code: "unavailable",
        });
    }

    const ordered = [
        ...candidates.filter((c) => c.key == prefer_key),
        ...candidates.filter((c) => c.key != prefer_key),
    ];

    const isReady = (candidate: HarnessCandidate) =>
        !cooldowns.get({ key: candidate.key, now: now() }) &&
        !cooldowns.get({ key: providerKey(candidate), now: now() });

    if (!ordered.some(isReady)) {
        const next = Math.min(
            ...ordered.map((candidate) =>
                Math.max(
                    cooldowns.get({ key: candidate.key, now: now() }) || 0,
                    cooldowns.get({ key: providerKey(candidate), now: now() }) ||
                        0,
                ),
            ),
        );

        throw new HarnessError({
            message: `Every ${title.toLowerCase()} model is resting after errors or rate limits. Trying again shortly.`,
            retryable: true,
            retry_at: next,
            resting: true,
        });
    }

    const errors: HarnessError[] = [];

    for (const candidate of ordered) {
        if (errors.length >= AppData.HarnessMaxCandidates) break;

        /**
         * Checked each time: a failure can bench the rest of its provider.
         */
        if (!isReady(candidate)) continue;

        try {
            const result = await run(candidate);

            await on_success?.({ candidate, result });

            return { result, candidate };
        } catch (error: unknown) {
            if (!(error instanceof HarnessError)) throw error;
            if (error.code == "aborted") throw error;

            errors.push(error);
            coolDown({ candidate, error, cooldowns, now: now() });
        }
    }

    const last = errors[errors.length - 1];

    if (!last) {
        throw new HarnessError({
            message: `Every ${title.toLowerCase()} model is resting after errors or rate limits. Trying again shortly.`,
            retryable: true,
            resting: true,
        });
    }

    const retry_ats = errors
        .map((error) => error.retry_at)
        .filter((at): at is number => typeof at == "number");

    throw new HarnessError({
        message:
            errors.length > 1
                ? `${errors.length} ${title.toLowerCase()} models failed. Last error: ${last.message}`
                : last.message,
        status: last.status,
        retryable: errors.some((error) => error.retryable),
        retry_at: retry_ats.length ? Math.min(...retry_ats) : undefined,
        candidate_key: last.candidate_key,
    });
}

function providerKey(candidate: HarnessCandidate) {
    return `provider:${candidate.provider.id ?? candidate.provider.base_url}`;
}

function coolDown({
    candidate,
    error,
    cooldowns,
    now,
}: {
    candidate: HarnessCandidate;
    error: HarnessError;
    cooldowns: HarnessCooldowns;
    now: number;
}) {
    if (error.provider_wide) {
        cooldowns.set({ key: providerKey(candidate), at: now + ProviderCooldownMs });
        return;
    }

    if (error.retryable) {
        const at = error.retry_at || now + AppData.HarnessCooldownMs;

        cooldowns.set({
            key: candidate.key,
            at: Math.min(at, now + AppData.HarnessMaxCooldownMs),
        });
        return;
    }

    if (error.status == 403 || error.status == 404) {
        cooldowns.set({ key: candidate.key, at: now + GoneCooldownMs });
    }
}
