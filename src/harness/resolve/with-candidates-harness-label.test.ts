import { afterAll, describe, expect, mock, test } from "bun:test";
import HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import type { HarnessKind } from "@/src/dict/harness-dict";
import createCooldowns from "./create-cooldowns";

const logged: { harness: string; key: string }[] = [];
const recorded: { harness: string; key: string }[] = [];

mock.module("./log-candidate-failure", () => ({
    default: async ({ harness, candidate }: { harness: string; candidate: HarnessCandidate }) => {
        logged.push({ harness, key: candidate.key });
    },
}));
mock.module("../usage/record-harness-failure", () => ({
    default: async ({ harness, candidate }: { harness: string; candidate: HarnessCandidate }) => {
        recorded.push({ harness, key: candidate.key });
    },
}));

const { default: withCandidates } = await import("./with-candidates");

afterAll(() => mock.restore());

function candidate(slug: string): HarnessCandidate {
    return {
        key: `1:${slug}`,
        provider: { id: 1, kind: "openrouter", base_url: "https://example.test" },
        model: { slug, input_modalities: ["text"], output_modalities: ["image"], supports_tools: false },
        source: "pinned",
    } as HarnessCandidate;
}

describe("withCandidates per-candidate harness label (L9)", () => {
    test("logs a failure under the candidate's own harness, not the call's pick", async () => {
        logged.length = 0;
        recorded.length = 0;

        const edit = candidate("qwen-image-edit");
        const handover = candidate("flux");

        await withCandidates({
            harness: "image_edit",
            harness_of: new Map<string, HarnessKind>([
                [edit.key, "image_edit"],
                [handover.key, "image"],
            ]),
            candidates: [edit, handover],
            cooldowns: createCooldowns(),
            log_failures: true,
            rest_ms: 120_000,
            run: async (c) => {
                if (c == edit) {
                    throw new HarnessError({ message: "edit failed", status: 503, retryable: true, candidate_key: c.key });
                }
                return "ok";
            },
        });

        expect(logged).toEqual([{ harness: "image_edit", key: edit.key }]);
        expect(recorded).toEqual([{ harness: "image_edit", key: edit.key }]);
    });

    test("a hand-over candidate that fails is logged under image, not image_edit", async () => {
        logged.length = 0;
        recorded.length = 0;

        const handover = candidate("flux");

        await withCandidates({
            harness: "image_edit",
            harness_of: new Map<string, HarnessKind>([[handover.key, "image"]]),
            candidates: [handover],
            cooldowns: createCooldowns(),
            log_failures: true,
            rest_ms: 120_000,
            run: async (c) => {
                throw new HarnessError({ message: "down", status: 503, retryable: true, candidate_key: c.key });
            },
        }).catch(() => {});

        expect(logged).toEqual([{ harness: "image", key: handover.key }]);
        expect(recorded).toEqual([{ harness: "image", key: handover.key }]);
    });
});