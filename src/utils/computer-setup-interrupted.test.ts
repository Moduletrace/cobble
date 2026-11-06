import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import computerSetupInterrupted from "./computer-setup-interrupted";

const now = 1_800_000_000_000;

describe("computerSetupInterrupted", () => {
    test("a setup touched lately is still running", () => {
        expect(computerSetupInterrupted({ status: "creating", updated_at: now - AppData.ComputerSetupHeartbeatMs, now })).toBe(false);
    });

    test("a setup nobody touched for the stale time was interrupted", () => {
        expect(computerSetupInterrupted({ status: "creating", updated_at: now - AppData.ComputerSetupStaleMs - 1, now })).toBe(true);
        expect(computerSetupInterrupted({ status: "creating", updated_at: null, now })).toBe(true);
    });

    test("only a computer being set up can be", () => {
        for (const status of ["running", "failed", "stopped", null]) {
            expect(computerSetupInterrupted({ status, updated_at: 0, now })).toBe(false);
        }
    });

    test("the heartbeat comes well inside the stale time", () => {
        expect(AppData.ComputerSetupStaleMs).toBeGreaterThanOrEqual(AppData.ComputerSetupHeartbeatMs * 3);
    });
});
