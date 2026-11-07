import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import taskIncomingBaselineSql from "./task-incoming-baseline-sql";

/**
 * A task run reads what the user wrote in its session after it was
 * queued. Run against real SQLite.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bot_messages (id INTEGER PRIMARY KEY, session_id INTEGER, author TEXT, created_at INTEGER)`);
db.run(`INSERT INTO bot_messages VALUES
    (1, 1, 'user', 100),
    (2, 1, 'bot', 200),
    (3, 2, 'user', 250),
    (4, 1, 'user', 300),
    (5, 1, 'bot', 400)`);

function baseline({ session_id, queued_at }: { session_id: number; queued_at: number }) {
    const { sql, values } = taskIncomingBaselineSql({ session_id, queued_at });

    return (db.query(sql).get(...values) as { id: number }).id;
}

describe("taskIncomingBaselineSql", () => {
    test("is the session's newest message when the run was queued", () => {
        expect(baseline({ session_id: 1, queued_at: 250 })).toBe(2);
        expect(baseline({ session_id: 1, queued_at: 300 })).toBe(4);
    });

    test("ignores other sessions", () => {
        expect(baseline({ session_id: 2, queued_at: 260 })).toBe(3);
        expect(baseline({ session_id: 1, queued_at: 260 })).toBe(2);
    });

    test("is 0 when the session had nothing yet", () => {
        expect(baseline({ session_id: 1, queued_at: 50 })).toBe(0);
        expect(baseline({ session_id: 9, queued_at: 500 })).toBe(0);
    });
});
