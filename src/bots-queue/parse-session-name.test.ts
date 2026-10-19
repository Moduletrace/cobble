import { describe, expect, test } from "bun:test";
import parseSessionName from "./parse-session-name";

describe("parseSessionName", () => {
    test("reads a title and summary", () => {
        expect(parseSessionName({ text: `{"title":"Tidy invoices","summary":"- sorted them"}` })).toEqual({
            title: "Tidy invoices",
            summary: "- sorted them",
        });
    });

    test("tolerates a code fence around the object", () => {
        expect(
            parseSessionName({
                text: "```json\n{\"title\":\"Plans\",\"summary\":\"- a trip\"}\n```",
            }),
        ).toEqual({ title: "Plans", summary: "- a trip" });
    });

    test("is null when either part is missing or the JSON is bad", () => {
        expect(parseSessionName({})).toBeNull();
        expect(parseSessionName({ text: "" })).toBeNull();
        expect(parseSessionName({ text: `{"title":"Only a title"}` })).toBeNull();
        expect(parseSessionName({ text: `{"title":"","summary":"- a trip"}` })).toBeNull();
        expect(parseSessionName({ text: "{nope" })).toBeNull();
    });
});
