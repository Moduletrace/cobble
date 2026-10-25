import { describe, expect, test } from "bun:test";
import type { CustomToolRecord } from "@/src/types";
import mergeCustomToolChanges from "./merge-custom-tool-changes";

const weather: CustomToolRecord = {
    id: 4,
    name: "weather",
    description: "Today's weather for a city",
    parameters: { type: "object", properties: { city: { type: "string" } } },
    all_bots: false,
    enabled: true,
    status: "ok",
    last_error: "",
    last_checked_at: null,
    kind: "http",
    config: {
        method: "GET",
        url: "https://api.weather.example/v1?city={{args.city}}",
        headers: { Authorization: "Bearer {{env.WEATHER_KEY}}", Accept: "application/json" },
        body: "",
    },
};

describe("mergeCustomToolChanges", () => {
    test("keeps the config it isn't given and changes headers one at a time", () => {
        const data = mergeCustomToolChanges({
            current: weather,
            changes: { config: { method: "POST", headers: { Accept: null, "X-Unit": "metric" } } },
        });

        expect(data.kind).toBe("http");
        expect(data.config).toMatchObject({
            method: "POST",
            url: weather.config.url,
            headers: { Authorization: "Bearer {{env.WEATHER_KEY}}", "X-Unit": "metric" },
        });
    });

    test("starts the config over when the kind changes", () => {
        const data = mergeCustomToolChanges({
            current: weather,
            changes: { kind: "prompt", config: { prompt: "Describe the weather in {{args.city}}" } },
        });

        expect(data.config).toEqual({ prompt: "Describe the weather in {{args.city}}" });
    });

    test("checks the result like the settings form", () => {
        expect(() => mergeCustomToolChanges({ current: null, changes: { name: "new_one", kind: "http" } })).toThrow();
    });
});
