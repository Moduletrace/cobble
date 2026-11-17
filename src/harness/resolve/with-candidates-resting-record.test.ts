import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { ForeverRestUntil } from "@/src/utils/run-limit";
import HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import createCooldowns from "./create-cooldowns";

/**
 * When every model is benched, the call never reaches one. It must still
 * leave a failed-call row against each resting model so the message its job
 * posts shows why nothing was tried - but it must not re-log the outage
 * (that was logged when the model first failed, and a benched model is
 * skipped on every call until it rests out).
 */
let recorded: any[] = [];
let logged: any[] = [];

mock.module("@/src/harness/usage/record-harness-failure", () => ({
    default: async (params: any) => {
        recorded.push(params);
    },
}));
mock.module("@/src/harness/resolve/log-candidate-failure", () => ({
    default: async (params: any) => {
        logged.push(params);
    },
}));

const withCandidates = (await import("./with-candidates")).default;

afterAll(() => {
    mock.restore();
});

const candidate: HarnessCandidate = {
    key: "2:qwen-image-3.0-pro",
    provider: { id: 2, kind: "custom", base_url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", name: "DashScope" },
    model: { slug: "qwen-image-3.0-pro", input_modalities: ["text"], output_modalities: ["image"], supports_tools: false },
    source: "pinned",
};

beforeEach(() => {
    recorded = [];
    logged = [];
});

describe("withCandidates records a call that only hit benched models", () => {
    test("records the resting model with its rest, and does not re-log the outage", async () => {
        const now = 1_000_000;
        const cooldowns = createCooldowns();
        cooldowns.set({ key: candidate.key, at: now + 60_000 });

        const error = (await withCandidates({
            harness: "image",
            candidates: [candidate],
            cooldowns,
            log_failures: true,
            now: () => now,
            run: async () => {
                throw new Error("should not run");
            },
        }).catch((e) => e)) as HarnessError;

        expect(error.resting).toBe(true);
        expect(recorded.length).toBe(1);
        expect(recorded[0].candidate).toBe(candidate);
        expect(recorded[0].harness).toBe("image");
        expect(recorded[0].error.message).toContain("Resting after an earlier failure");
        expect(recorded[0].rests_until).toBe(now + 60_000);
        expect(logged).toEqual([]);
    });

    test("an unlimited rest is recorded with the forever sentinel", async () => {
        const now = 1_000_000;
        const cooldowns = createCooldowns();
        cooldowns.set({ key: candidate.key, at: Infinity });

        await withCandidates({
            harness: "image",
            candidates: [candidate],
            cooldowns,
            log_failures: true,
            now: () => now,
            run: async () => {
                throw new Error("should not run");
            },
        }).catch(() => {});

        expect(recorded.length).toBe(1);
        expect(recorded[0].rests_until).toBe(ForeverRestUntil);
    });

    test("records under the candidate's own harness when a call mixes them", async () => {
        const now = 1_000_000;
        const cooldowns = createCooldowns();
        cooldowns.set({ key: candidate.key, at: now + 60_000 });

        await withCandidates({
            harness: "image_edit",
            harness_of: new Map([[candidate.key, "image"]]),
            candidates: [candidate],
            cooldowns,
            log_failures: true,
            now: () => now,
            run: async () => {
                throw new Error("should not run");
            },
        }).catch(() => {});

        expect(recorded[0].harness).toBe("image");
    });

    test("records nothing when failure logging is off", async () => {
        const now = 1_000_000;
        const cooldowns = createCooldowns();
        cooldowns.set({ key: candidate.key, at: now + 60_000 });

        await withCandidates({
            harness: "image",
            candidates: [candidate],
            cooldowns,
            now: () => now,
            run: async () => {
                throw new Error("should not run");
            },
        }).catch(() => {});

        expect(recorded).toEqual([]);
        expect(logged).toEqual([]);
    });
});
