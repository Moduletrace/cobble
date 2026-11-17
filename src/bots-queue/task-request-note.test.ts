import { describe, expect, test } from "bun:test";
import taskRequestNote from "./task-request-note";

describe("taskRequestNote", () => {
    test("puts the user's own words in front of the brief", () => {
        const note = taskRequestNote({
            message: { author: "user", text: "Convert this to PSD using the Artcraft MCP PhotoCraft" },
        });

        expect(note).toContain("# What the user asked for");
        expect(note).toContain("Convert this to PSD using the Artcraft MCP PhotoCraft");
        expect(note).toContain("The brief below it is your own summary");
        expect(note).toContain("these words win");
    });

    test("is empty for what the user didn't write", () => {
        expect(taskRequestNote({ message: { author: "bot", text: "Please make a PSD" } })).toBe("");
        expect(taskRequestNote({ message: { author: "", text: "Please make a PSD" } })).toBe("");
        expect(taskRequestNote({ message: null })).toBe("");
        expect(taskRequestNote({})).toBe("");
    });

    test("is empty without text", () => {
        expect(taskRequestNote({ message: { author: "user", text: "" } })).toBe("");
        expect(taskRequestNote({ message: { author: "user", text: "   \n " } })).toBe("");
        expect(taskRequestNote({ message: { author: "user" } })).toBe("");
    });

    test("trims the request and writes no em dash", () => {
        const note = taskRequestNote({ message: { author: "user", text: "\n\n  Make it A5  \n\n" } });

        expect(note.endsWith("Make it A5")).toBe(true);
        expect(note).not.toContain("\u2014");
    });
});