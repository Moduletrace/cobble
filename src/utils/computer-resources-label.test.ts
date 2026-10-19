import { describe, expect, test } from "bun:test";
import computerResourcesLabel from "./computer-resources-label";

describe("computerResourcesLabel", () => {
    test("shows what the computer has", () => {
        expect(computerResourcesLabel({ computer: { cpus: 2, memory_mb: 4096 } })).toBe("2 CPUs · 4 GB");
        expect(computerResourcesLabel({ computer: { cpus: 0.5, memory_mb: 1536 } })).toBe("0.5 CPUs · 1.5 GB");
    });

    test("falls back to the defaults", () => {
        expect(computerResourcesLabel({ computer: { cpus: null as never, memory_mb: undefined } })).toBe("1 CPU · 2 GB");
    });
});
