import { describe, expect, test } from "bun:test";
import stripQuestionRefs from "./strip-question-refs";

describe("stripQuestionRefs", () => {
    test("takes a question that ends a report out of it", () => {
        const { text, removed } = stripQuestionRefs({
            text: "I wrote the schema and seeded it.\n\nBefore I commit:\n\n[question:9]",
        });

        expect(removed).toBe(true);
        expect(text).toBe("I wrote the schema and seeded it.\n\nBefore I commit:");
    });

    test("takes every one of them out, in the middle of a line too", () => {
        const { text, removed } = stripQuestionRefs({
            text: "Asked [question:3] and [question:4] above, then waited.",
        });

        expect(removed).toBe(true);
        expect(text).toBe("Asked and above, then waited.");
    });

    test("leaves text with no question as it was", () => {
        const report = "Done.\n\n- Built it\n- Tested it\n";

        expect(stripQuestionRefs({ text: report })).toEqual({ text: report, removed: false });
    });

    test("leaves something that only looks like a ref alone", () => {
        expect(stripQuestionRefs({ text: "See [question:abc]." }).removed).toBe(false);
    });

    test("takes its code span with it, since one quoted alone still links", () => {
        expect(stripQuestionRefs({ text: "Waiting on `[question:9]` here." }).text).toBe(
            "Waiting on here.",
        );
    });

    test("a report that was nothing but the question is empty", () => {
        expect(stripQuestionRefs({ text: "[question:9]\n" }).text).toBe("");
    });
});