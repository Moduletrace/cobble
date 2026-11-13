import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import openSessionReplyStepSql from "./open-session-reply-step-sql";

/**
 * A conversation that reloads mid-reply reads the step the run is on from
 * the server. It must be the open reply job's newest tool step, never a
 * task's (a task brings its own), never a finished job's, never a closing
 * note (its text is the answer) and never another session's.
 */
function setup() {
    const db = new Database(":memory:");

    db.run(
        `CREATE TABLE bots_queue (id INTEGER PRIMARY KEY, kind TEXT, status TEXT, session_id INTEGER, task_id INTEGER)`,
    );
    db.run(
        `CREATE TABLE bots_queue_updates (id INTEGER PRIMARY KEY, bots_queue_id INTEGER, bot_id INTEGER, kind TEXT, text TEXT, metadata TEXT, created_at INTEGER)`,
    );

    db.run(`INSERT INTO bots_queue (id, kind, status, session_id, task_id) VALUES
        (10, 'reply', 'processing', 1, NULL),
        (11, 'task', 'processing', 1, 50),
        (12, 'reply', 'completed', 1, NULL),
        (13, 'reply', 'processing', 2, NULL)`);

    db.run(`INSERT INTO bots_queue_updates (id, bots_queue_id, bot_id, kind, text, metadata, created_at) VALUES
        (100, 10, 7, 'tool', 'Reading the invoice', NULL, 1000),
        (101, 10, 7, 'note', 'Here is the invoice', NULL, 1001),
        (102, 11, 7, 'tool', 'Using sandbox_execute_bash', NULL, 1002),
        (103, 12, 7, 'tool', 'Read the finished job', NULL, 1003),
        (104, 13, 7, 'tool', 'Reading another session', NULL, 1004)`);

    return db;
}

describe("openSessionReplyStepSql", () => {
    test("reads the open reply's newest tool step, with its job's task and session", () => {
        const db = setup();
        const { sql, values } = openSessionReplyStepSql({ session_id: 1 });
        const step = db.query(sql).get(...values) as {
            id: number;
            bots_queue_id: number;
            bot_id: number;
            kind: string;
            text: string;
            task_id: number | null;
            session_id: number;
        } | null;

        expect(step?.id).toBe(100);
        expect(step?.text).toBe("Reading the invoice");
        expect(step?.bot_id).toBe(7);
        expect(step?.task_id).toBeNull();
        expect(step?.session_id).toBe(1);
    });

    test("a session with no reply running has no step", () => {
        const db = setup();
        db.run(`UPDATE bots_queue SET status = 'completed' WHERE id = 10`);

        const { sql, values } = openSessionReplyStepSql({ session_id: 1 });

        expect(db.query(sql).get(...values)).toBeNull();
    });
});