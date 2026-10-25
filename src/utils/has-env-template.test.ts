import { describe, expect, test } from "bun:test";
import hasEnvTemplate from "./has-env-template";

describe("hasEnvTemplate", () => {
    test("finds an env template, however it's spaced or cased", () => {
        expect(hasEnvTemplate({ values: ["Bearer {{env.KEY}}"] })).toBe(true);
        expect(hasEnvTemplate({ values: ["https://x.example/?k={{ ENV . KEY }}"] })).toBe(true);
        expect(hasEnvTemplate({ values: [undefined, "plain", "{{env.A}}"] })).toBe(true);
    });

    test("leaves arguments and plain text alone", () => {
        expect(hasEnvTemplate({ values: ["{{args.city}}", "environment", "", null] })).toBe(false);
    });
});
