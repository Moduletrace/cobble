import { describe, expect, test } from "bun:test";
import parseJobJson from "./parse-job-json";

describe("parseJobJson", () => {
    test("reads a JSON object", () => {
        expect(parseJobJson({ text: `{"step":2}` })).toEqual({ step: 2 });
    });

    test("is null for empty, invalid or non-object JSON", () => {
        expect(parseJobJson({})).toBeNull();
        expect(parseJobJson({ text: "" })).toBeNull();
        expect(parseJobJson({ text: "{nope" })).toBeNull();
        expect(parseJobJson({ text: "[1]" })).toBeNull();
        expect(parseJobJson({ text: "3" })).toBeNull();
    });
});
