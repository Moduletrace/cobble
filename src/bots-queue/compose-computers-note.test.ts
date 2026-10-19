import { describe, expect, test } from "bun:test";
import composeComputersNote from "./compose-computers-note";

describe("composeComputersNote", () => {
    test("lists each computer by ref, the current one first", () => {
        const note = composeComputersNote({
            computers: [
                { id: 4, name: "Scraper", kind: "sandbox", description: "Runs the crawlers" },
                { id: 1, name: "Main computer", kind: "main" },
            ],
        });

        expect(note).toContain(
            "- [computer:4] Scraper (you're on it): Runs the crawlers\n- [computer:1] Main computer (main)",
        );
        expect(note).toContain("search_computers");
        expect(note).toContain("start_task");
    });

    test("tells the coordinator it can use and assign every computer", () => {
        const computers = [{ id: 1, name: "Main computer", kind: "main" as const }];

        expect(composeComputersNote({ computers, is_coordinator: true })).toContain("assign_computer");
        expect(composeComputersNote({ computers })).not.toContain("assign_computer");
    });

    test("says so when the bot has no computer", () => {
        expect(composeComputersNote({ computers: [] })).toContain("You have no computer");
    });
});
