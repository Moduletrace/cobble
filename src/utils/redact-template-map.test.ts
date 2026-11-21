import { describe, expect, it } from "bun:test";
import redactTemplateMap from "./redact-template-map";

describe("redactTemplateMap", () => {
    it("keeps templates and names every literal value it left behind", () => {
        const res = redactTemplateMap({
            values: { Authorization: "Bearer sk-live", "X-Trace": "{{env.TRACE}}" },
            label: "header",
        });

        expect(res).toEqual({
            values: { "X-Trace": "{{env.TRACE}}" },
            redacted: ["header Authorization"],
        });
    });

    it("keeps a template that only ends in one", () => {
        const res = redactTemplateMap({ values: { Authorization: "Bearer {{env.GITHUB_TOKEN}}" }, label: "header" });

        expect(res).toEqual({ values: { Authorization: "Bearer {{env.GITHUB_TOKEN}}" }, redacted: [] });
    });

    it("keeps an empty value: there is nothing to hide", () => {
        expect(redactTemplateMap({ values: { Accept: "" }, label: "header" })).toEqual({
            values: { Accept: "" },
            redacted: [],
        });
    });

    it("reads a template however it is spaced or cased", () => {
        const res = redactTemplateMap({ values: { KEY: "{{ ENV . key }}" }, label: "env" });

        expect(res.redacted).toEqual([]);
    });
});