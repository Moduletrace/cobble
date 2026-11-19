import { describe, expect, test } from "bun:test";
import unfinishedAnswerText from "./unfinished-answer-text";

describe("unfinishedAnswerText", () => {
    test("a table row that stops after its label is unfinished", () => {
        const text = ["| Skill | Focus |", "|-------|-------|", "| **revops** | Lead routing"].join("\n");

        expect(unfinishedAnswerText({ text }) ?? "").toContain("table row");
    });

    test("a separator is not an open row", () => {
        expect(unfinishedAnswerText({ text: "| Skill | Focus |\n|-------|-------|" })).toBeNull();
    });

    test("a table row whose last cell never closed is unfinished", () => {
        const text = "| **revops** | Lead routing, scoring";

        expect(unfinishedAnswerText({ text })).toContain("table row");
    });

    test("a finished table is a reply", () => {
        const text = ["| Skill | Focus |", "| **revops** | Lead routing |", "", "Want me to pull one in full?"].join("\n");

        expect(unfinishedAnswerText({ text })).toBeNull();
    });

    test("a fence left open is unfinished", () => {
        expect(unfinishedAnswerText({ text: "The script:\n\n```ts\nconst n = 1" })).toContain("code fence");
    });

    test("a closed fence is a reply", () => {
        expect(unfinishedAnswerText({ text: "```ts\nconst n = 1\n```\n\nThat is the whole script." })).toBeNull();
    });

    test("a heading or list marker with nothing under it is unfinished", () => {
        expect(unfinishedAnswerText({ text: "What I found\n\n##" })).toContain("heading");
        expect(unfinishedAnswerText({ text: "Next:\n\n-" })).toContain("heading");
        expect(unfinishedAnswerText({ text: "1." })).toContain("heading");
    });

    test("a finished heading and a pipe in prose are replies", () => {
        expect(unfinishedAnswerText({ text: "## What I found\n\nTwo repos, nothing pulled yet." })).toBeNull();
        expect(unfinishedAnswerText({ text: "Use a | between the columns when you write it." })).toBeNull();
    });
});
