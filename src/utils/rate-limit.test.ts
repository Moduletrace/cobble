import { describe, expect, test } from "bun:test";
import rateLimit, { resetRateLimit } from "./rate-limit";

describe("rateLimit", () => {
    test("allows hits up to the limit then blocks", () => {
        const key = `test:${crypto.randomUUID()}`;

        for (let i = 0; i < 3; i++) {
            expect(rateLimit({ key, limit: 3, window_ms: 60_000 }).allowed).toBe(
                true,
            );
        }

        expect(rateLimit({ key, limit: 3, window_ms: 60_000 }).allowed).toBe(
            false,
        );
    });

    test("resets after the window expires", async () => {
        const key = `test:${crypto.randomUUID()}`;

        rateLimit({ key, limit: 1, window_ms: 5 });
        expect(rateLimit({ key, limit: 1, window_ms: 5 }).allowed).toBe(false);

        await Bun.sleep(10);

        expect(rateLimit({ key, limit: 1, window_ms: 5 }).allowed).toBe(true);
    });

    test("resetRateLimit clears the bucket", () => {
        const key = `test:${crypto.randomUUID()}`;

        rateLimit({ key, limit: 1, window_ms: 60_000 });
        resetRateLimit({ key });

        expect(rateLimit({ key, limit: 1, window_ms: 60_000 }).allowed).toBe(
            true,
        );
    });

    test("keeps buckets independent", () => {
        const a = `test:${crypto.randomUUID()}`;
        const b = `test:${crypto.randomUUID()}`;

        rateLimit({ key: a, limit: 1, window_ms: 60_000 });

        expect(rateLimit({ key: a, limit: 1, window_ms: 60_000 }).allowed).toBe(
            false,
        );
        expect(rateLimit({ key: b, limit: 1, window_ms: 60_000 }).allowed).toBe(
            true,
        );
    });
});
