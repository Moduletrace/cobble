import { describe, expect, test } from "bun:test";
import type { HarnessOverview } from "@/src/types";
import {
    harnessCatalogFromOverview,
    harnessSettingsFromOverview,
    mergeHarnessOverview,
} from "./harness-overview-parts";

const overview: HarnessOverview = {
    harness: "text",
    title: "Text",
    description: "Chats.",
    required: true,
    automatic: true,
    model_id: 4,
    provider_id: 1,
    providers: [{ id: 1, name: "OpenRouter" }],
    fallback: false,
    enabled: true,
    options: { voice: "alloy" },
    models: [
        {
            id: 4,
            provider_id: 1,
            provider_name: "OpenRouter",
            slug: "deepseek",
            name: "DeepSeek",
            free: true,
        },
    ],
    current: {
        id: 4,
        provider_id: 1,
        provider_name: "OpenRouter",
        slug: "deepseek",
        name: "DeepSeek",
        free: true,
        source: "pinned",
    },
    candidate_count: 2,
    inherit: false,
};

describe("harness overview parts", () => {
    test("splits the install-wide catalog from the conversation's setting", () => {
        const [catalog] = harnessCatalogFromOverview({ harnesses: [overview] });
        const [setting] = harnessSettingsFromOverview({ harnesses: [overview] });

        expect(catalog).toMatchObject({
            harness: "text",
            title: "Text",
            providers: overview.providers,
            models: overview.models,
        });
        expect(setting).not.toHaveProperty("models");
        expect(setting).not.toHaveProperty("providers");
        expect(setting).toMatchObject({
            harness: "text",
            model_id: 4,
            provider_id: 1,
            fallback: false,
            enabled: true,
        });
    });

    test("merges a cached catalog and setting back into the form's shape", () => {
        const [catalog] = harnessCatalogFromOverview({ harnesses: [overview] });
        const [setting] = harnessSettingsFromOverview({ harnesses: [overview] });

        expect(
            mergeHarnessOverview({ catalog: [catalog!], settings: [setting!] }),
        ).toEqual([overview]);
    });

    test("waits for both parts", () => {
        const [catalog] = harnessCatalogFromOverview({ harnesses: [overview] });

        expect(mergeHarnessOverview({ catalog: [catalog!], settings: [] })).toBeUndefined();
        expect(mergeHarnessOverview({ catalog: [], settings: [] })).toBeUndefined();
    });

    test("keeps a picked model the catalog no longer lists", () => {
        const [catalog] = harnessCatalogFromOverview({
            harnesses: [{ ...overview, models: [] }],
        });
        const [setting] = harnessSettingsFromOverview({ harnesses: [overview] });
        const [merged] = mergeHarnessOverview({ catalog: [catalog!], settings: [setting!] })!;

        expect(setting?.pinned_model).toEqual(overview.models[0]);
        expect(merged?.models).toEqual(overview.models);
    });

    test("keeps a provider the catalog no longer lists", () => {
        const without_providers = { ...overview, providers: [], models: [] };
        const [catalog] = harnessCatalogFromOverview({ harnesses: [without_providers] });
        const [setting] = harnessSettingsFromOverview({ harnesses: [without_providers] });
        const [merged] = mergeHarnessOverview({ catalog: [catalog!], settings: [setting!] })!;

        expect(merged?.providers).toEqual([
            { id: 1, name: "Unavailable provider" },
        ]);
    });
});
