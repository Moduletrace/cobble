import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import seenHookCallSql from "./seen-hook-call-sql";

/**
 * A sender retrying a delivery it already made doesn't run the bot twice,
 * while a delivery that was refused, made to another hook or made long
 * ago still runs.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bot_hook_events (id INTEGER PRIMARY KEY, hook_id INTEGER, idempotency_key TEXT, status TEXT, created_at INTEGER)`);
db.run(`INSERT INTO bot_hook_events VALUES
    (1, 1, 'a', 'queued', 1000),
    (2, 1, 'b', 'merged', 1000),
    (3, 1, 'c', 'rejected', 1000),
    (4, 2, 'd', 'queued', 1000),
    (5, 1, 'e', 'queued', 10)`);

function seen(hook_id: number, key: string) {
    const { sql, values } = seenHookCallSql({ hook_id, idempotency_key: key, since: 100 });

    return Boolean(db.query(sql).get(...values));
}

describe("seenHookCallSql", () => {
    test("finds a delivery that queued a run or joined one", () => {
        expect(seen(1, "a")).toBe(true);
        expect(seen(1, "b")).toBe(true);
    });

    test("ignores refused, other hooks', old and new deliveries", () => {
        expect(seen(1, "c")).toBe(false);
        expect(seen(1, "d")).toBe(false);
        expect(seen(1, "e")).toBe(false);
        expect(seen(1, "z")).toBe(false);
    });
});
