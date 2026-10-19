import { describe, expect, test } from "bun:test";
import fillTemplate from "./fill-template";

describe("fillTemplate", () => {
    test("fills args and envs", () => {
        expect(
            fillTemplate({
                template: "https://api.test/{{args.city}}?key={{ env.API_KEY }}",
                args: { city: "Lagos" },
                envs: [{ key: "API_KEY", value: "abc" }],
            }),
        ).toBe("https://api.test/Lagos?key=abc");
    });

    test("objects become JSON, missing args empty, dotted paths reach in", () => {
        expect(
            fillTemplate({
                template: "{{args.filter}}|{{args.missing}}|{{args.filter.tag}}",
                args: { filter: { tag: "x" } },
            }),
        ).toBe('{"tag":"x"}||x');
    });

    test("encodes filled arguments only", () => {
        expect(
            fillTemplate({
                template: "{{env.BASE}}/q?s={{args.q}}&x=a b",
                args: { q: "a b&c" },
                envs: [{ key: "BASE", value: "https://x.test/v1" }],
                encode: encodeURIComponent,
            }),
        ).toBe("https://x.test/v1/q?s=a%20b%26c&x=a b");
    });

    test("an unset env throws, naming it", () => {
        expect(() => fillTemplate({ template: "{{env.NOPE}}" })).toThrow("NOPE");
    });

    test("leaves other braces alone", () => {
        expect(fillTemplate({ template: '{"a": "{{other}}"}' })).toBe('{"a": "{{other}}"}');
    });
});
