import { describe, expect, test } from "bun:test";
import HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import createCooldowns from "./create-cooldowns";
import withCandidates from "./with-candidates";

function candidate(slug: string, provider_id = 1): HarnessCandidate {
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
        source: "auto",
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
});
