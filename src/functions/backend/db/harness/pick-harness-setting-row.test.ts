import { describe, expect, test } from "bun:test";
import pickHarnessSettingRow from "./pick-harness-setting-row";

const bot_row = { owner: "bot" };
const workspace_row = { owner: "workspace" };
const default_row = { owner: "default" };

describe("pickHarnessSettingRow", () => {
    test("a bot's own pick wins, in a workspace too", () => {
        expect(
            pickHarnessSettingRow({ bot_row, workspace_row, default_row }),
        ).toEqual({ row: bot_row, source: "bot" });
    });

    test("without its own pick a bot in a workspace inherits the workspace's", () => {
        expect(pickHarnessSettingRow({ workspace_row, default_row })).toEqual({
            row: workspace_row,
            source: "workspace",
        });
    });

    test("the defaults come last", () => {
        expect(pickHarnessSettingRow({ default_row })).toEqual({
            row: default_row,
            source: "default",
        });
    });

    test("no rows at all is still the defaults", () => {
        expect(pickHarnessSettingRow({})).toEqual({
            row: undefined,
            source: "default",
        });
    });
});