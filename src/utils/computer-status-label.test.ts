import { describe, expect, test } from "bun:test";
import computerStatusLabel from "./computer-status-label";

describe("computerStatusLabel", () => {
    test("names the state", () => {
        expect(computerStatusLabel({ computer: { id: 1, status: "running" } })).toBe("Running");
        expect(computerStatusLabel({ computer: { id: 1, status: "creating" } })).toBe("Setting up…");
        expect(computerStatusLabel({ computer: { id: 1 } })).toBe("Unknown");
    });

    test("says why setup failed", () => {
        expect(computerStatusLabel({ computer: { id: 1, status: "failed", error: "no docker" } })).toBe(
            "Setup failed: no docker",
        );
    });
});
