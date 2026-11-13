import { describe, expect, test } from "bun:test";
import parseBotSuggestionRow from "./parse-bot-suggestion-row";

describe("parseBotSuggestionRow", () => {
    test("reads the suggested steps", () => {
        expect(parseBotSuggestionRow({ row: { steps: JSON.stringify(["Write the report", "Email the team"]) } })).toEqual({
            steps: ["Write the report", "Email the team"],
        });
    });

    test("keeps only readable strings", () => {
        expect(parseBotSuggestionRow({ row: { steps: JSON.stringify(["Write it", 4, "", "  "]) } })).toEqual({ steps: ["Write it"] });
    });

    test("reads nothing from a missing or broken column", () => {
        expect(parseBotSuggestionRow({ row: { steps: null } })).toEqual({ steps: [] });
        expect(parseBotSuggestionRow({ row: { steps: "{" } })).toEqual({ steps: [] });
        expect(parseBotSuggestionRow({ row: { steps: JSON.stringify({ a: 1 }) } })).toEqual({ steps: [] });
    });
});