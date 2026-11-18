import { describe, expect, test } from "bun:test";
import parseHostDirectoryCheck from "./parse-host-directory-check";

describe("parseHostDirectoryCheck", () => {
    test("no check is null", () => {
        expect(parseHostDirectoryCheck({ text: null })).toBeNull();
        expect(parseHostDirectoryCheck({ text: "" })).toBeNull();
    });

    test("what isn't a check is no check", () => {
        expect(parseHostDirectoryCheck({ text: "not json" })).toBeNull();
        expect(parseHostDirectoryCheck({ text: JSON.stringify({ checked_at: 1 }) })).toBeNull();
        expect(parseHostDirectoryCheck({ text: JSON.stringify({ accounts: "all" }) })).toBeNull();
    });

    test("reads its accounts", () => {
        expect(
            parseHostDirectoryCheck({
                text: JSON.stringify({
                    accounts: [{ bot_id: 6, name: "bot #6", uid: 100_006, readable: true, writable: false }],
                    computer_id: 3,
                    checked_at: 1_700_000_000_000,
                    error: null,
                }),
            })
        ).toEqual({
            accounts: [{ bot_id: 6, name: "bot #6", uid: 100_006, readable: true, writable: false }],
            computer_id: 3,
            checked_at: 1_700_000_000_000,
            error: null,
        });
    });

    test("fills what a stored check missed", () => {
        expect(parseHostDirectoryCheck({ text: JSON.stringify({ accounts: [{ name: "bot #6" }] }) })).toEqual({
            accounts: [{ bot_id: null, name: "bot #6", uid: 0, readable: false, writable: false }],
            computer_id: null,
            checked_at: 0,
            error: null,
        });
    });
});