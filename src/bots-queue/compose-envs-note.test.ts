import { describe, expect, test } from "bun:test";
import composeEnvsNote from "./compose-envs-note";

describe("composeEnvsNote", () => {
    test("lists the computer's envs and the tools-only ones apart", () => {
        const note = composeEnvsNote({
            on_computer: [{ key: "DB_PASSWORD", description: "Production database" }],
            tools_only: [{ key: "API_TOKEN", description: "" }],
            has_computer: true,
        });

        expect(note).toContain("- DB_PASSWORD: Production database");
        expect(note).toContain("- API_TOKEN");
        expect(note).not.toContain("- API_TOKEN:");
        expect(note.indexOf("DB_PASSWORD")).toBeLessThan(note.indexOf("Only in tools"));
        expect(note).toContain("Don't ask the user for them");
    });

    test("says where each env comes from", () => {
        const note = composeEnvsNote({
            on_computer: [{ key: "DB_PASSWORD", description: "Production database", paradigm: "workspace" }],
            tools_only: [{ key: "TOKEN", description: "", paradigm: "user" }],
            has_computer: true,
        });

        expect(note).toContain("- DB_PASSWORD (this workspace's, every bot in it has it): Production database");
        expect(note).toContain("- TOKEN (this user's own, for you)");
        expect(note).toContain("never needs setting again per bot");
    });

    test("never mentions values", () => {
        const note = composeEnvsNote({ on_computer: [{ key: "K", description: "d" }], tools_only: [], has_computer: true });

        expect(note).not.toContain("Only in tools");
        expect(note).toContain("you never see values");
    });

    test("says so when nothing is set", () => {
        expect(composeEnvsNote({ on_computer: [], tools_only: [], has_computer: false })).toContain("No envs are set");
    });
});
