import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import searchHookCallsSql, { type SearchHookCallsParams } from "./search-hook-calls-sql";

/**
 * Searching hook calls only ever reads the user's own hooks, and finds a
 * call by what it sent or what its run answered. Run against real SQLite.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bot_hooks (id INTEGER PRIMARY KEY, user_id INTEGER, bot_id INTEGER, workspace_id INTEGER, title TEXT)`);
db.run(`CREATE TABLE bot_hook_events (id INTEGER PRIMARY KEY, created_at INTEGER, hook_id INTEGER, job_id INTEGER,
    payload TEXT, content_type TEXT, source_ip TEXT, idempotency_key TEXT, status TEXT, error TEXT, response TEXT,
    response_message_id INTEGER, responded_at INTEGER)`);
db.run(`INSERT INTO bot_hooks VALUES (1, 1, 10, NULL, 'Orders'), (2, 1, 11, NULL, 'Builds'), (3, 2, 10, NULL, 'Theirs')`);
db.run(`INSERT INTO bot_hook_events (id, hook_id, payload, status, response, error) VALUES
    (1, 1, '{"order":"A-100"}', 'done', 'Shipped A-100', NULL),
    (2, 1, '{"order":"B-200"}', 'failed', 'Timed out', NULL),
    (3, 2, '{"build":"green"}', 'done', 'All 100% passing', NULL),
    (4, 3, '{"order":"A-100"}', 'done', 'Not yours', NULL),
    (5, 1, 'bad', 'rejected', NULL, 'Bad or missing signature')`);

function ids(params: Partial<SearchHookCallsParams>) {
    const { sql, values } = searchHookCallsSql({ user_id: 1, ...params });

    return (db.query(sql).all(...values) as { id: number }[]).map((row) => row.id);
}

describe("searchHookCallsSql", () => {
    test("lists only the user's calls, newest first", () => {
        expect(ids({})).toEqual([5, 3, 2, 1]);
        expect(ids({ user_id: 2 })).toEqual([4]);
    });

    test("finds a call by its payload, response or error", () => {
        expect(ids({ query: "A-100" })).toEqual([1]);
        expect(ids({ query: "timed OUT" })).toEqual([2]);
        expect(ids({ query: "signature" })).toEqual([5]);
    });

    test("matches % and _ literally", () => {
        expect(ids({ query: "100%" })).toEqual([3]);
        expect(ids({ query: "_" })).toEqual([]);
    });

    test("filters by hook, bot and status, and pages", () => {
        expect(ids({ hook_id: 2 })).toEqual([3]);
        expect(ids({ bot_id: 10 })).toEqual([5, 2, 1]);
        expect(ids({ status: "done" })).toEqual([3, 1]);
        expect(ids({ before_id: 3, limit: 1 })).toEqual([2]);
    });

    test("cuts payloads and responses to previews", () => {
        const { sql, values } = searchHookCallsSql({ user_id: 1, hook_id: 2, preview_chars: 3 });
        const [row] = db.query(sql).all(...values) as { payload: string; response: string; hook_title: string }[];

        expect(row).toMatchObject({ payload: '{"b', response: "All", hook_title: "Builds" });
    });
});
