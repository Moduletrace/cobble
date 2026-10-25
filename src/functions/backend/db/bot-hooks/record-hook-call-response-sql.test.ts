import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import recordHookCallResponseSql from "./record-hook-call-response-sql";

/**
 * A run's response lands on every call it took in, and on nothing else.
 * Run against real SQLite, since a wrong condition would either miss the
 * calls merged into the run or write over calls already answered.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bot_hook_events (id INTEGER PRIMARY KEY, hook_id INTEGER, job_id INTEGER, status TEXT,
    response TEXT, response_message_id INTEGER, responded_at INTEGER, updated_at INTEGER)`);
db.run(`INSERT INTO bot_hook_events (id, hook_id, job_id, status) VALUES
    (1, 1, 10, 'queued'),
    (2, 1, 10, 'merged'),
    (3, 1, 11, 'queued'),
    (4, 2, 10, 'queued'),
    (5, 1, 10, 'rejected'),
    (6, 1, 12, 'done')`);

function record(params: Parameters<typeof recordHookCallResponseSql>[0]) {
    const { sql, values } = recordHookCallResponseSql(params);

    return (db.query(sql).all(...values) as { id: number }[]).map((row) => row.id);
}

function row(id: number) {
    return db.query(`SELECT * FROM bot_hook_events WHERE id = ?`).get(id) as Record<string, unknown>;
}

describe("recordHookCallResponseSql", () => {
    test("answers every call the run took in", () => {
        expect(record({ hook_id: 1, job_id: 10, status: "done", response: "Done it", message_id: 7, now: 42 })).toEqual([1, 2]);
        expect(row(1)).toMatchObject({ status: "done", response: "Done it", response_message_id: 7, responded_at: 42 });
        expect(row(2)).toMatchObject({ status: "done", response: "Done it" });
    });

    test("leaves other runs, other hooks and settled calls alone", () => {
        expect(row(3)).toMatchObject({ status: "queued", response: null });
        expect(row(4)).toMatchObject({ status: "queued", response: null });
        expect(row(5)).toMatchObject({ status: "rejected", response: null });
        expect(record({ hook_id: 1, job_id: 12, status: "failed", response: "Nope", now: 43 })).toEqual([]);
        expect(row(6)).toMatchObject({ status: "done", response: null });
    });

    test("a failed run keeps why", () => {
        expect(record({ hook_id: 1, job_id: 11, status: "failed", response: "Timed out", now: 44 })).toEqual([3]);
        expect(row(3)).toMatchObject({ status: "failed", response: "Timed out", response_message_id: null });
    });
});
