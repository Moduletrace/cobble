import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import { computerWorkspaceQuotaMb } from "./grab-computer-workspace-quota-bytes";

/**
 * An install that never touched the setting gets the code's default, while
 * one that saved 0 asked for no limit: reading the two alike either caps
 * every computer at a limit nobody set, or leaves them all uncapped.
 */
describe("computerWorkspaceQuotaMb", () => {
    test("never saved means the default", () => {
        expect(computerWorkspaceQuotaMb({ saved: undefined })).toBe(AppData.ComputerWorkspaceQuotaMb);
        expect(computerWorkspaceQuotaMb({ saved: null })).toBe(AppData.ComputerWorkspaceQuotaMb);
        expect(computerWorkspaceQuotaMb({ saved: "  " })).toBe(AppData.ComputerWorkspaceQuotaMb);
    });

    test("saved 0 means no limit", () => {
        expect(computerWorkspaceQuotaMb({ saved: "0" })).toBe(0);
    });

    test("a saved number is the limit", () => {
        expect(computerWorkspaceQuotaMb({ saved: "20480" })).toBe(20480);
        expect(computerWorkspaceQuotaMb({ saved: "512.5" })).toBe(512.5);
    });

    test("something that isn't a number is the default, and a negative is no limit", () => {
        expect(computerWorkspaceQuotaMb({ saved: "lots" })).toBe(AppData.ComputerWorkspaceQuotaMb);
        expect(computerWorkspaceQuotaMb({ saved: "-1" })).toBe(0);
    });
});