import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { HarnessProviderConfig } from "../../types";

/**
 * What the provider's `/models` answers. `null` makes the body unreadable.
 */
let payload: unknown = null;

mock.module("./provider-request", () => ({
    default: async () => ({ json: async () => payload }),
}));

const { default: listModels } = await import("./list-models");
const { default: HarnessError } = await import("../../harness-error");

afterAll(() => mock.restore());

const provider: HarnessProviderConfig = { kind: "custom", base_url: "http://localhost:1234", name: "Test" };
const signal = new AbortController().signal;

beforeEach(() => {
    payload = null;
});

describe("listModels empty and unreadable lists (M1)", () => {
    test("a 200 with an empty object is a failed sync, not an empty catalog", async () => {
        payload = {};
        await expect(listModels({ provider, signal })).rejects.toThrow("empty model list");
    });

    test("a 200 with data: [] is a failed sync too", async () => {
        payload = { data: [] };
        await expect(listModels({ provider, signal })).rejects.toThrow("empty model list");
    });

    test("the empty-list failure is retryable (a later sync may recover)", async () => {
        payload = { data: [] };
        const error = await listModels({ provider, signal }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(HarnessError);
        expect((error as InstanceType<typeof HarnessError>).retryable).toBe(true);
    });

    test("an unreadable body is a failed sync", async () => {
        payload = null;
        await expect(listModels({ provider, signal })).rejects.toThrow("unreadable model list");
    });

    test("a real list still comes through", async () => {
        payload = { data: [{ id: "alpha" }, { id: "beta" }] };
        const models = await listModels({ provider, signal });
        expect(models.map((model) => model.slug)).toEqual(["alpha", "beta"]);
    });

    test("OpenRouter's empty list is a failed sync as well", async () => {
        payload = { data: [] };
        await expect(
            listModels({ provider: { ...provider, kind: "openrouter" }, signal }),
        ).rejects.toThrow("empty model list");
    });
});
