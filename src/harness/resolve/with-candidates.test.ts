import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import createCooldowns from "./create-cooldowns";
import withCandidates from "./with-candidates";

function candidate(
    slug: string,
    provider_id = 1,
    source: HarnessCandidate["source"] = "auto",
): HarnessCandidate {
    return {
        key: `${provider_id}:${slug}`,
        provider: {
            id: provider_id,
            kind: "openrouter",
            base_url: "https://example.test",
        },
        model: {
            slug,
            input_modalities: ["text"],
            output_modalities: ["text"],
            supports_tools: true,
        },
        source,
    };
}

const rateLimited = (key: string, retry_at?: number) =>
    new HarnessError({
        message: `${key} rate limited`,
        status: 429,
        retryable: true,
        retry_at,
        candidate_key: key,
    });

describe("withCandidates", () => {
    test("falls through to the next model and cools the failed one down", async () => {
        const cooldowns = createCooldowns();
        const tried: string[] = [];
        const a = candidate("a");
        const b = candidate("b");

        const { result, candidate: used } = await withCandidates({
            harness: "text",
            candidates: [a, b],
            cooldowns,
            run: async (c) => {
                tried.push(c.model.slug);
                if (c == a) throw rateLimited(a.key);
                return "ok";
            },
        });

        expect(result).toBe("ok");
        expect(used).toBe(b);
        expect(tried).toEqual(["a", "b"]);
        expect(cooldowns.get({ key: a.key })).toBeGreaterThan(Date.now());

        tried.length = 0;
        await withCandidates({
            harness: "text",
            candidates: [a, b],
            cooldowns,
            run: async (c) => tried.push(c.model.slug),
        });

        expect(tried).toEqual(["b"]);
    });

    test("tries the preferred model first", async () => {
        const tried: string[] = [];

        await withCandidates({
            harness: "text",
            candidates: [candidate("a"), candidate("b")],
            prefer_key: "1:b",
            cooldowns: createCooldowns(),
            run: async (c) => tried.push(c.model.slug),
        });

        expect(tried).toEqual(["b"]);
    });

    test("a bad key benches every model on that provider", async () => {
        const cooldowns = createCooldowns();
        const tried: string[] = [];

        await withCandidates({
            harness: "text",
            candidates: [candidate("a", 1), candidate("b", 1), candidate("c", 2)],
            cooldowns,
            run: async (c) => {
                tried.push(c.model.slug);
                if (c.provider.id == 1) {
                    throw new HarnessError({
                        message: "bad key",
                        status: 401,
                        provider_wide: true,
                    });
                }
            },
        });

        expect(tried).toEqual(["a", "c"]);
    });

    test("reports the last failure, retryable if any failure was", async () => {
        const promise = withCandidates({
            harness: "text",
            candidates: [candidate("a"), candidate("b")],
            cooldowns: createCooldowns(),
            run: async (c) => {
                if (c.model.slug == "a") throw rateLimited("1:a", 5000);
                throw new HarnessError({ message: "bad request", status: 400 });
            },
            now: () => 1000,
        });

        const error = (await promise.catch((e) => e)) as HarnessError;

        expect(error).toBeInstanceOf(HarnessError);
        expect(error.message).toBe(
            "2 text models failed. Last error: bad request",
        );
        expect(error.retryable).toBe(true);
        expect(error.retry_at).toBe(5000);
    });

    test("is unavailable with nothing to try", async () => {
        const error = (await withCandidates({
            harness: "speech",
            candidates: [],
            run: async () => {},
        }).catch((e) => e)) as HarnessError;

        expect(error.code).toBe("unavailable");
        expect(error.retryable).toBe(false);
    });

    test("waits instead of calling when everything is cooling down", async () => {
        const cooldowns = createCooldowns();
        const a = candidate("a");

        cooldowns.set({ key: a.key, at: Date.now() + 60_000 });

        const error = (await withCandidates({
            harness: "text",
            candidates: [a],
            cooldowns,
            run: async () => {
                throw new Error("should not run");
            },
        }).catch((e) => e)) as HarnessError;

        expect(error.retryable).toBe(true);
        expect(error.retry_at).toBeGreaterThan(Date.now());
    });

    test("a rest with no end keeps the model benched until the run limits change", async () => {
        const now = 1_000_000;
        const cooldowns = createCooldowns();
        const a = candidate("a");

        await withCandidates({
            harness: "text",
            candidates: [a],
            cooldowns,
            rest_ms: Infinity,
            now: () => now,
            run: async () => {
                throw rateLimited(a.key);
            },
        }).catch(() => {});

        expect(cooldowns.get({ key: a.key, now: now + 5 * 365 * 24 * 3600 * 1000 })).toBe(Infinity);

        const error = (await withCandidates({
            harness: "text",
            candidates: [a],
            cooldowns,
            rest_ms: Infinity,
            now: () => now,
            run: async () => {
                throw new Error("should not run");
            },
        }).catch((e) => e)) as HarnessError;

        expect(error.message).toContain("stay benched until the run limits change or the app restarts");
        expect(error.resting).toBe(true);
        expect(error.retry_at).toBe(now + AppData.HarnessMaxCooldownMs);
    });

    test("cancellation and bugs are not swallowed", async () => {
        const run = (error: Error) =>
            withCandidates({
                harness: "text",
                candidates: [candidate("a"), candidate("b")],
                cooldowns: createCooldowns(),
                run: async () => {
                    throw error;
                },
            }).catch((e) => e);

        const aborted = new HarnessError({ message: "x", code: "aborted" });

        expect(await run(aborted)).toBe(aborted);

        const bug = new TypeError("oops");

        expect(await run(bug)).toBe(bug);
    });

    test("a failed model rests no longer than the model rest, whatever it was", async () => {
        const now = 1_000_000;
        const rest_ms = 120_000;

        for (const error of [
            new HarnessError({ message: "gone", status: 404 }),
            new HarnessError({ message: "refused", status: 403 }),
            rateLimited("1:a", now + 60 * 60 * 1000),
            new HarnessError({ message: "down", status: 503, retryable: true }),
        ]) {
            const cooldowns = createCooldowns();
            const a = candidate("a", 1, "pinned");

            await withCandidates({
                harness: "text",
                candidates: [a, candidate("b")],
                cooldowns,
                rest_ms,
                now: () => now,
                run: async (c) => {
                    if (c == a) throw error;
                },
            });

            expect(cooldowns.get({ key: a.key, now })).toBe(now + rest_ms);
        }
    });

    test("a provider that says to come back sooner rests only that long", async () => {
        const now = 1_000_000;
        const cooldowns = createCooldowns();
        const a = candidate("a");

        await withCandidates({
            harness: "text",
            candidates: [a, candidate("b")],
            cooldowns,
            rest_ms: 120_000,
            now: () => now,
            run: async (c) => {
                if (c == a) throw rateLimited(a.key, now + 5_000);
            },
        });

        expect(cooldowns.get({ key: a.key, now })).toBe(now + 5_000);
    });

    test("a refused request benches nothing", async () => {
        const cooldowns = createCooldowns();
        const a = candidate("a");

        await withCandidates({
            harness: "text",
            candidates: [a, candidate("b")],
            cooldowns,
            rest_ms: 120_000,
            run: async (c) => {
                if (c == a) throw new HarnessError({ message: "bad request", status: 400 });
            },
        });

        expect(cooldowns.get({ key: a.key })).toBeUndefined();
    });

    test("tells the answer which models failed and which were resting", async () => {
        const cooldowns = createCooldowns();
        const pinned = candidate("pinned", 1, "pinned");
        const first = candidate("first", 2, "fallback");
        const second = candidate("second", 3, "fallback");
        let seen: { failed: string[]; resting: string[] } | undefined;

        cooldowns.set({ key: pinned.key, at: Date.now() + 60_000 });

        await withCandidates({
            harness: "text",
            candidates: [pinned, first, second],
            cooldowns,
            rest_ms: 120_000,
            run: async (c) => {
                if (c == first) throw rateLimited(first.key);
            },
            on_success: ({ failed, resting }) => {
                seen = { failed: [...failed], resting: [...resting] };
            },
        });

        expect(seen).toEqual({ failed: [first.key], resting: [pinned.key] });
    });

    test("a run on an automatic pick goes back to the pick and its fallbacks once they rested", async () => {
        const tried: string[] = [];

        await withCandidates({
            harness: "text",
            candidates: [candidate("pinned", 1, "pinned"), candidate("fallback", 2, "fallback"), candidate("free-a"), candidate("free-b")],
            prefer_key: "1:free-b",
            cooldowns: createCooldowns(),
            rest_ms: 120_000,
            run: async (c) => {
                tried.push(c.model.slug);
                if (c.source != "auto") throw rateLimited(c.key);
            },
        });

        expect(tried).toEqual(["pinned", "fallback", "free-b"]);
    });
});
