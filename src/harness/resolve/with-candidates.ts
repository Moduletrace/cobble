import { AppData } from "@/src/data/app-data";
import { ForeverRestUntil } from "@/src/utils/run-limit";
import { Harnesses, type HarnessKind } from "@/src/dict/harness-dict";
import HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import type { HarnessCooldowns } from "./create-cooldowns";
import grabModelRestMs from "./grab-model-rest-ms";
import DefaultCooldowns from "./harness-cooldowns";
import recordHarnessFailure from "../usage/record-harness-failure";
import logCandidateFailure from "./log-candidate-failure";

type Params<T> = {
    harness: HarnessKind;
    /**
     * The harness each candidate was actually picked for, when a call
     * mixes them (an image call with references tries image_edit picks and
     * image hand-overs). A failure is logged under the candidate's own
     * harness, not the call's pick label (L9). Falls back to `harness`.
     */
    harness_of?: Map<string, HarnessKind>;
    candidates: HarnessCandidate[];
    run: (candidate: HarnessCandidate) => Promise<T>;
    /**
     * The model a multi-step run already uses, so it doesn't switch models
     * mid-task without a reason. It goes before the other automatic picks,
     * never before the pick or its fallback models: a run that fell back
     * goes back to them once they've rested.
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
        /**
         * The candidates that failed before this one answered, by key.
         */
        failed: string[];
        /**
         * The candidates ahead of this one that were passed over because
         * they were resting after an earlier failure, by key.
         */
        resting: string[];
    }) => Promise<void> | void;
    cooldowns?: HarnessCooldowns;
    /**
     * How long a failed candidate rests. Read from the install's setting
     * (`grabModelRestMs`) when not given.
     */
    rest_ms?: number;
    /**
     * Writes each failure to the activity log (`logCandidateFailure`) and
     * to the run's failed calls (`recordHarnessFailure`, shown in its
     * message's details). On by default for the process-wide cooldowns,
     * i.e. real calls.
     */
    log_failures?: boolean;
    now?: () => number;
};

/**
 * Runs a harness call on the first candidate that works, in order
 * (`orderCandidates`), up to `AppData.HarnessMaxCandidates` tries.
 * Candidates (and providers) on cooldown are skipped; a failure puts its
 * candidate, or its whole provider for a key problem, on cooldown for the
 * install's model rest (`coolDown`) and is logged.
 *
 * Throws a `HarnessError`: `unavailable` when there is nothing to try,
 * otherwise the last failure, `retryable` if any failure was.
 */
export default async function withCandidates<T>({
    harness,
    harness_of,
    candidates,
    run,
    prefer_key,
    on_success,
    cooldowns = DefaultCooldowns,
    rest_ms,
    log_failures = cooldowns === DefaultCooldowns,
    now = Date.now,
}: Params<T>): Promise<{ result: T; candidate: HarnessCandidate }> {
    const title = Harnesses.find((h) => h.value == harness)?.title || harness;

    if (!candidates.length) {
        throw new HarnessError({
            message: `No ${title.toLowerCase()} model is set up. A super admin can pick one in Settings, under Models.`,
            code: "unavailable",
        });
    }

    const ordered = orderCandidates({ candidates, prefer_key });

    const isReady = (candidate: HarnessCandidate) =>
        !cooldowns.get({ key: candidate.key, now: now() }) &&
        !cooldowns.get({ key: providerKey(candidate), now: now() });

    if (!ordered.some(isReady)) {
        const next = soonestRest({ candidates: ordered, cooldowns, now: now() });

        /**
         * The call never reached a model: every candidate is benched from an
         * earlier failure. Record the call against each resting model so the
         * message its job posts shows why nothing was tried (a generate_image
         * that only ever hit benched models once left no failed-call row at
         * all). The outage itself was logged when the model first failed, so
         * it isn't logged again here: a benched model is skipped on every
         * call until it rests out, and re-logging would spam the activity log.
         */
        if (log_failures) {
            for (const candidate of ordered) {
                const rests_until = Math.max(
                    cooldowns.get({ key: candidate.key, now: now() }) || 0,
                    cooldowns.get({ key: providerKey(candidate), now: now() }) || 0,
                );

                await recordHarnessFailure({
                    harness: harness_of?.get(candidate.key) || harness,
                    candidate,
                    error: new HarnessError({
                        message: "Resting after an earlier failure; this call didn't try it.",
                        retryable: true,
                        resting: true,
                        candidate_key: candidate.key,
                    }),
                    rests_until: Number.isFinite(rests_until) ? rests_until : ForeverRestUntil,
                });
            }
        }

        throw new HarnessError({
            message: Number.isFinite(next)
                ? `Every ${title.toLowerCase()} model is resting after errors or rate limits. The next try is possible in ${waitText({ ms: next - now() })}.`
                : `Every ${title.toLowerCase()} model is resting after errors or rate limits. They stay benched until the run limits change or the app restarts. A super admin can pick a working model or add a fallback in Settings, under Models.`,
            retryable: true,
            retry_at: Number.isFinite(next) ? next : now() + AppData.HarnessMaxCooldownMs,
            resting: true,
        });
    }

    const errors: HarnessError[] = [];
    const failed: string[] = [];
    const resting: string[] = [];
    const rest = rest_ms ?? (await grabModelRestMs());

    for (const candidate of ordered) {
        if (errors.length >= AppData.HarnessMaxCandidates) break;

        /**
         * Checked each time: a failure can bench the rest of its provider.
         */
        if (!isReady(candidate)) {
            resting.push(candidate.key);
            continue;
        }

        try {
            const result = await run(candidate);

            await on_success?.({ candidate, result, failed, resting });

            return { result, candidate };
        } catch (error: unknown) {
            if (!(error instanceof HarnessError)) throw error;
            if (error.code == "aborted") throw error;

            /**
             * The model's own name goes on the failure: a tool tells the bot
             * why the call failed, and a bot with "HTTP 404" alone invented
             * the model and its routing (production, Nov 2026).
             */
            error.model_name ||= candidate.model.slug;

            errors.push(error);
            failed.push(candidate.key);

            const rests_until = coolDown({ candidate, error, cooldowns, now: now(), rest_ms: rest });
            /**
             * A rest with no end (`harness_model_rest_seconds` unlimited)
             * never runs out. The Activity log records it as unlimited; the
             * failed-call row carries the `ForeverRestUntil` sentinel so the
             * Details modal can read back the same account instead of a
             * blank (L3).
             */
            const forever = typeof rests_until == "number" && !Number.isFinite(rests_until);

            if (log_failures) {
                const failed_harness = harness_of?.get(candidate.key) || harness;

                await logCandidateFailure({
                    harness: failed_harness,
                    candidate,
                    error,
                    rests_until: forever ? undefined : rests_until,
                    forever,
                });
                await recordHarnessFailure({
                    harness: failed_harness,
                    candidate,
                    error,
                    rests_until: forever ? ForeverRestUntil : rests_until,
                });
            }
        }
    }

    const last = errors[errors.length - 1];

    if (!last) {
        const next = soonestRest({ candidates: ordered, cooldowns, now: now() });

        throw new HarnessError({
            message: Number.isFinite(next)
                ? `Every ${title.toLowerCase()} model is resting after errors or rate limits. The next try is possible in ${waitText({ ms: next - now() })}.`
                : `Every ${title.toLowerCase()} model is resting after errors or rate limits. They stay benched until the run limits change or the app restarts.`,
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
        model_name: last.model_name,
        method: last.method,
        url: last.url,
    });
}

function providerKey(candidate: HarnessCandidate) {
    return `provider:${candidate.provider.id ?? candidate.provider.base_url}`;
}

/**
 * When the first of these candidates is ready again, in ms (`Infinity` for a
 * rest with no end).
 */
function soonestRest({
    candidates,
    cooldowns,
    now,
}: {
    candidates: HarnessCandidate[];
    cooldowns: HarnessCooldowns;
    now: number;
}) {
    return Math.min(
        ...candidates.map((candidate) =>
            Math.max(
                cooldowns.get({ key: candidate.key, now }) || 0,
                cooldowns.get({ key: providerKey(candidate), now }) || 0,
            ),
        ),
    );
}

/**
 * A rest as a person reads it: "27s", "4m", "2h". A resting call says how
 * long: told only "trying again shortly", a bot told the user the models were
 * benched until the app restarted (production, Nov 2026).
 */
function waitText({ ms }: { ms: number }) {
    const seconds = Math.max(1, Math.round(ms / 1000));

    if (seconds < 90) return `${seconds}s`;

    const minutes = Math.round(seconds / 60);

    return minutes < 90 ? `${minutes}m` : `${Math.round(minutes / 60)}h`;
}

/**
 * The order candidates are tried in: as resolved (the pick, its fallback
 * models, then the automatic picks), with the model a run already uses
 * moved ahead of the other automatic picks.
 */
function orderCandidates({
    candidates,
    prefer_key,
}: {
    candidates: HarnessCandidate[];
    prefer_key?: string;
}) {
    const preferred = candidates.find((c) => c.key == prefer_key);

    if (!preferred || preferred.source != "auto") return candidates;

    return [
        ...candidates.filter((c) => c.source != "auto"),
        preferred,
        ...candidates.filter((c) => c.source == "auto" && c != preferred),
    ];
}

/**
 * Benches a failed candidate (or its whole provider, for a bad key or no
 * credits) for `rest_ms`, or until the provider says to come back when
 * that's sooner. A request the model refused (400, 422) benches nothing:
 * it's about that request. Returns when it may be tried again, if benched.
 */
function coolDown({
    candidate,
    error,
    cooldowns,
    now,
    rest_ms,
}: {
    candidate: HarnessCandidate;
    error: HarnessError;
    cooldowns: HarnessCooldowns;
    now: number;
    rest_ms: number;
}) {
    const until = now + rest_ms;

    if (error.provider_wide) {
        cooldowns.set({ key: providerKey(candidate), at: until });
        return until;
    }

    if (error.retryable) {
        /**
         * A `Retry-After` of 0 or a date already past would bench the model
         * for no time at all, so the next turn hits it again at once. Floor
         * the bench at a few seconds, still capped by the model's rest (L2).
         */
        const at = Math.min(
            Math.max(error.retry_at || until, now + AppData.HarnessRetryAfterFloorMs),
            until,
        );

        cooldowns.set({ key: candidate.key, at });
        return at;
    }

    if (error.status == 403 || error.status == 404) {
        cooldowns.set({ key: candidate.key, at: until });
        return until;
    }

    return undefined;
}
