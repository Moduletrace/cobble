import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import browserAccessRows from "./browser-access-rows";
import browserRunAllowed from "./browser-run-allowed";
import browserScopeSql from "./browser-scope-sql";
import pickDefaultBrowser from "./pick-default-browser";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE browser_access (id INTEGER PRIMARY KEY, user_id INTEGER, browser_id INTEGER, bot_id INTEGER, workspace_id INTEGER, is_default INTEGER DEFAULT 0)`);
    db.run(`INSERT INTO browser_access (id, user_id, browser_id, bot_id, workspace_id, is_default) VALUES
        (1, 7, 100, NULL, NULL, 1),
        (2, 7, 101, 2, NULL, 1),
        (3, 7, 102, NULL, 11, 1),
        (4, 7, 103, 3, NULL, 0),
        (5, 8, 200, NULL, NULL, 1),
        (6, 8, 201, 2, NULL, 1)`);
});

function rows({ user_id, bot_id, workspace_id }: { user_id: number; bot_id: number; workspace_id?: number }) {
    const scope = browserScopeSql({ alias: "ba", user_id, bot_id, workspace_id });

    return db.query(`SELECT ba.* FROM browser_access ba WHERE ${scope.sql} ORDER BY id`).all(...scope.values) as {
        id: number;
        browser_id: number;
        bot_id: number | null;
        workspace_id: number | null;
        is_default: number;
    }[];
}

describe("browserScopeSql", () => {
    test("a run only ever sees its own user's rows, on the same bot", () => {
        expect(rows({ user_id: 7, bot_id: 2 }).map((row) => row.id)).toEqual([1, 2]);
        expect(rows({ user_id: 8, bot_id: 2 }).map((row) => row.id)).toEqual([5, 6]);
    });

    test("a user with no rows gets nothing from anyone else's", () => {
        expect(rows({ user_id: 9, bot_id: 2 })).toEqual([]);
    });

    test("another bot's and another workspace's rows don't apply", () => {
        expect(rows({ user_id: 7, bot_id: 5 }).map((row) => row.id)).toEqual([1]);
        expect(rows({ user_id: 7, bot_id: 5, workspace_id: 12 }).map((row) => row.id)).toEqual([1]);
    });
});

describe("pickDefaultBrowser", () => {
    const usable_ids = [100, 101, 102, 103];

    test("the workspace wins over the bot, the bot over all bots", () => {
        expect(pickDefaultBrowser({ rows: rows({ user_id: 7, bot_id: 2, workspace_id: 11 }), usable_ids })).toBe(102);
        expect(pickDefaultBrowser({ rows: rows({ user_id: 7, bot_id: 2 }), usable_ids })).toBe(101);
        expect(pickDefaultBrowser({ rows: rows({ user_id: 7, bot_id: 5 }), usable_ids })).toBe(100);
    });

    test("no default means the computer's browser", () => {
        expect(pickDefaultBrowser({ rows: [], usable_ids })).toBeNull();
    });

    test("a narrower computer row beats a wider browser default", () => {
        expect(
            pickDefaultBrowser({
                rows: [
                    { browser_id: 100, is_default: 1 },
                    { browser_id: null, bot_id: 2, is_default: 1 },
                ],
                usable_ids,
            }),
        ).toBeNull();
    });

    test("a default that's off falls through to the computer's", () => {
        expect(pickDefaultBrowser({ rows: rows({ user_id: 7, bot_id: 5 }), usable_ids: [101] })).toBeNull();
    });
});

describe("browserAccessRows", () => {
    test("the default is always available, and only one", () => {
        expect(browserAccessRows({ default_browser: 3, available_ids: [1, 2] })).toEqual([
            { browser_id: 1, is_default: 0 },
            { browser_id: 2, is_default: 0 },
            { browser_id: 3, is_default: 1 },
        ]);
    });

    test("the computer's browser gets a row only as a default", () => {
        expect(browserAccessRows({ default_browser: "computer", available_ids: [] })).toEqual([
            { browser_id: null, is_default: 1 },
        ]);
        expect(browserAccessRows({ default_browser: "inherit", available_ids: [1] })).toEqual([
            { browser_id: 1, is_default: 0 },
        ]);
    });
});

describe("browserRunAllowed", () => {
    test("a run someone follows may reach it", () => {
        expect(browserRunAllowed({ run_kind: "attended" })).toBe(true);
    });

    test("a routine needs the owner's say", () => {
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: 0 })).toBe(false);
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: 1 })).toBe(true);
    });

    test("hook calls and chatrooms never do, whatever the switch says", () => {
        expect(browserRunAllowed({ run_kind: "unattended", allow_routines: 1 })).toBe(false);
    });
});
