import { describe, expect, test } from "bun:test";
import parseSettingsRecordPath from "./parse-settings-record-path";

describe("parseSettingsRecordPath", () => {
    test("reads a nested settings record", () => {
        expect(
            parseSettingsRecordPath({ pathname: "/admin/settings/bots/3" }),
        ).toEqual({ kind: "bots", id: "3" });
        expect(
            parseSettingsRecordPath({
                pathname: "/admin/settings/workspaces/12/",
            }),
        ).toEqual({ kind: "workspaces", id: "12" });
        expect(
            parseSettingsRecordPath({ pathname: "/admin/settings/users/8" }),
        ).toEqual({ kind: "users", id: "8" });
    });

    test("ignores settings list pages and other paths", () => {
        expect(
            parseSettingsRecordPath({ pathname: "/admin/settings/bots" }),
        ).toBeNull();
        expect(
            parseSettingsRecordPath({ pathname: "/admin/settings/models" }),
        ).toBeNull();
        expect(
            parseSettingsRecordPath({
                pathname: "/admin/settings/bots/3/models",
            }),
        ).toBeNull();
        expect(
            parseSettingsRecordPath({ pathname: "/admin/bots/3" }),
        ).toBeNull();
        expect(parseSettingsRecordPath({ pathname: undefined })).toBeNull();
    });
});
