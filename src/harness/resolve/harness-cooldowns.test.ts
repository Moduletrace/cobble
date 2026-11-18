import { describe, expect, test } from "bun:test";
import HarnessCooldowns from "./harness-cooldowns";

/**
 * The benches must be one store for the whole process. bunext bundles API
 * routes and the server entry separately, so a module-scoped map let a
 * run-limits save clear the API bundle's copy while the queue kept its own:
 * a rest with no end survived the save that was supposed to end it.
 */
describe("HarnessCooldowns", () => {
    test("lives on the shared global slot", () => {
        const holder = globalThis as Record<symbol, unknown>;

        expect(holder[Symbol.for("cobble.harnessCooldowns")]).toBe(HarnessCooldowns);
    });

    test("a second copy of the module is the same store", async () => {
        const specifier = "./harness-cooldowns.ts?bundle=2";
        const other = (await import(specifier)).default;

        expect(other).toBe(HarnessCooldowns);

        HarnessCooldowns.set({ key: "9:test-model", at: Date.now() + 60_000 });

        expect(other.get({ key: "9:test-model" })).toBeGreaterThan(Date.now());

        other.clear();

        expect(HarnessCooldowns.get({ key: "9:test-model" })).toBeUndefined();
    });
});