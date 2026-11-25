import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import unansweredMessageSql from "./unanswered-message-sql";

/**
 * A carry must notice the user's words it would leave behind: a message
 * written after the one the reply answers (or after a plan's step was
 * queued) is unanswered, and the session it is in is not safe to close.
 * Crew messages and the message the job answers are not the user's new
 * words.
 */
const db = new Database(":memory:");

db.run(
    `CREATE TABLE bot_messages (id INTEGER PRIMARY KEY, session_id INTEGER, author TEXT,
        from_ask_id INTEGER, from_install_request_id INTEGER, created_at INTEGER)`,
);
db.run(`CREATE TABLE bots_queue (id INTEGER PRIMARY KEY, message_id INTEGER, created_at INTEGER)`);

db.run(`INSERT INTO bots_queue VALUES (10, 100, 1000), (11, NULL, 2000)`);

db.run(`INSERT INTO bot_messages VALUES
    (100, 5, 'user', NULL, NULL, 900),
    (101, 5, 'user', NULL, NULL, 1100),
    (102, 5, 'user', 3, NULL, 1200),
    (103, 5, 'user', NULL, 4, 1300),
    (104, 5, 'bot', NULL, NULL, 1400),
    (200, 6, 'user', NULL, NULL, 2100),
    (201, 6, 'bot', NULL, NULL, 2200)`);

function unanswered({ session_id, job_id }: { session_id: number; job_id: number }) {
    const condition = unansweredMessageSql({ session_id, job_id });

    return Boolean(
        (
            db.query(`SELECT ${condition.sql} AS unanswered`).get(...condition.values) as
                | { unanswered: number }
                | null
        )?.unanswered,
    );
}

describe("unansweredMessageSql", () => {
    test("a message written after the one the job answers is unanswered", () => {
        expect(unanswered({ session_id: 5, job_id: 10 })).toBe(true);
    });

    test("the message the job answers is not", () => {
        db.run(`DELETE FROM bot_messages WHERE id IN (101, 102, 103)`);

        expect(unanswered({ session_id: 5, job_id: 10 })).toBe(false);

        db.run(`INSERT INTO bot_messages VALUES
            (101, 5, 'user', NULL, NULL, 1100),
            (102, 5, 'user', 3, NULL, 1200),
            (103, 5, 'user', NULL, 4, 1300)`);
    });

    test("a crew message is never the user's words", () => {
        db.run(`DELETE FROM bot_messages WHERE id = 101`);

        expect(unanswered({ session_id: 5, job_id: 10 })).toBe(false);

        db.run(`INSERT INTO bot_messages VALUES (101, 5, 'user', NULL, NULL, 1100)`);
    });

    test("a step queued with no message counts what the user wrote after it", () => {
        expect(unanswered({ session_id: 6, job_id: 11 })).toBe(true);

        db.run(`DELETE FROM bot_messages WHERE id = 200`);

        expect(unanswered({ session_id: 6, job_id: 11 })).toBe(false);

        db.run(`INSERT INTO bot_messages VALUES (200, 6, 'user', NULL, NULL, 2100)`);
    });

    test("a job queued after the session's messages counts none of them", () => {
        expect(unanswered({ session_id: 5, job_id: 11 })).toBe(false);
    });
});