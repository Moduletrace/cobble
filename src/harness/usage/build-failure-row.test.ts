import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";
import buildFailureRow from "./build-failure-row";

const candidate: HarnessCandidate = {
    key: "3:vendor/model",
    provider: { id: 3, kind: "openrouter", name: "Work key", base_url: "https://example.test" },
    model: {
        slug: "vendor/model",
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_tools: true,
        row_id: 42,
    } as HarnessCandidate["model"],
    source: "fallback",
};

describe("buildFailureRow", () => {
    test("attributes the failure to the run's scope with the provider's reason", () => {
        const row = buildFailureRow({
            harness: "text",
            candidate,
            error: new HarnessError({ message: "Rate limited", status: 429, retryable: true }),
            rests_until: 1_000,
            scope: { user_id: "7", bot_id: 2, workspace_id: null, session_id: 5, job_id: 9 },
        });

        expect(row).toEqual({
            user_id: 7,
            bot_id: 2,
            workspace_id: undefined,
            session_id: 5,
            message_id: undefined,
            job_id: 9,
            harness: "text",
            provider_id: 3,
            provider_name: "Work key",
            model_id: 42,
            model_slug: "vendor/model",
            source: "fallback",
            status: 429,
            error: "Rate limited",
            rests_until: 1_000,
        });
    });

    test("writes nothing without an owner", () => {
        const row = buildFailureRow({
            harness: "text",
            candidate,
            error: new HarnessError({ message: "Down" }),
            scope: { bot_id: 2 },
        });

        expect(row).toBeNull();
    });

    test("cuts a long error", () => {
        const row = buildFailureRow({
            harness: "image",
            candidate,
            error: new HarnessError({ message: "x".repeat(AppData.HarnessFailureErrorMaxChars + 50) }),
            scope: { user_id: 1 },
        });

        expect(row?.error?.length).toBe(AppData.HarnessFailureErrorMaxChars);
        expect(row?.status).toBeUndefined();
    });
});
