import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import answeredMessageIdSql from "./answered-message-id-sql";

/**
 * What decides whether a queued reply still has something to answer, run
 * against real SQLite: only finished replies in the same session count, so
 * a failed or still running one never hides a message.
 */
const db = new Database(":memory:");

db.run(
    `CREATE TABLE bots_queue (id INTEGER PRIMARY KEY, session_id INTEGER, kind TEXT, status TEXT, message_id INTEGER)`,
);
db.run(`INSERT INTO bots_queue VALUES
    (1, 100, 'reply', 'completed', 10),
    (2, 100, 'reply', 'completed', 14),
    (3, 100, 'reply', 'processing', 20),
    (4, 100, 'reply', 'failed', 22),
    (5, 100, 'task', 'completed', 30),
    (6, 101, 'reply', 'completed', 40),
    (7, 102, 'reply', 'pending', 50)`);

function answered(session_id: number) {
    const { sql, values } = answeredMessageIdSql({ session_id });

    return (db.query(sql).get(...values) as { id: number | null }).id;
}

describe("answeredMessageIdSql", () => {
    test("is the newest message a finished reply in the session read", () => {
        expect(answered(100)).toBe(14);
        expect(answered(101)).toBe(40);
    });

    test("ignores running and failed replies, and tasks", () => {
        expect(answered(100)).not.toBe(20);
        expect(answered(100)).not.toBe(22);
        expect(answered(100)).not.toBe(30);
    });

    test("is null where no reply has finished", () => {
        expect(answered(102)).toBe(null);
        expect(answered(999)).toBe(null);
    });
});
