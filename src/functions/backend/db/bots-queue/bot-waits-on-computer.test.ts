import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { botWaitsOnComputerSql } from "./bot-waits-on-computer";

/**
 * Real SQLite: the face says "Waiting for its computer" only while a run
 * of this bot's user's is queued behind another task on that same
 * computer. Anything looser reads every queued run as a computer wait.
 */
const db = new Database(":memory:");

beforeEach(() => {
    db.run(`DROP TABLE IF EXISTS bots_queue`);
    db.run(`DROP TABLE IF EXISTS bot_sessions`);
    db.run(`DROP TABLE IF EXISTS bot_hooks`);
    db.run(`CREATE TABLE bots_queue (
        id INTEGER PRIMARY KEY,
        kind TEXT,
        status TEXT,
        bot_id INTEGER,
        session_id INTEGER,
        computer_id INTEGER
    )`);
    db.run(`CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, user_id INTEGER, ask_id INTEGER, hook_id INTEGER)`);
    db.run(`CREATE TABLE bot_hooks (id INTEGER PRIMARY KEY, silent INTEGER)`);
});

function job(row: { id: number; kind: string; status: string; session_id: number; computer_id?: number | null }) {
    db.run(`INSERT INTO bots_queue (id, kind, status, bot_id, session_id, computer_id) VALUES (?, ?, ?, 1, ?, ?)`, [
        row.id,
        row.kind,
        row.status,
        row.session_id,
        row.computer_id ?? null,
    ]);
}

const waits = () => {
    const { sql, values } = botWaitsOnComputerSql({ bot_id: 1, user_id: 1 });

    return db.query(sql).all(...values).length > 0;
};

describe("botWaitsOnComputerSql", () => {
    test("a queued run behind a task on the same computer is waiting on it", () => {
        db.run(`INSERT INTO bot_sessions VALUES (10, 1, NULL, NULL)`);
        job({ id: 1, kind: "task", status: "processing", session_id: 10, computer_id: 4 });
        job({ id: 2, kind: "task", status: "pending", session_id: 10, computer_id: 4 });

        expect(waits()).toBe(true);
    });

    test("a queued run on another computer is not", () => {
        db.run(`INSERT INTO bot_sessions VALUES (10, 1, NULL, NULL)`);
        job({ id: 1, kind: "task", status: "processing", session_id: 10, computer_id: 4 });
        job({ id: 2, kind: "task", status: "pending", session_id: 10, computer_id: 5 });

        expect(waits()).toBe(false);
    });

    test("no reason yet is not a computer wait", () => {
        db.run(`INSERT INTO bot_sessions VALUES (10, 1, NULL, NULL)`);
        job({ id: 1, kind: "task", status: "processing", session_id: 10, computer_id: 4 });
        job({ id: 2, kind: "reply", status: "pending", session_id: 10, computer_id: null });

        expect(waits()).toBe(false);
    });

    test("another user's queue does not show on this face", () => {
        db.run(`INSERT INTO bot_sessions VALUES (10, 2, NULL, NULL)`);
        job({ id: 1, kind: "task", status: "processing", session_id: 10, computer_id: 4 });
        job({ id: 2, kind: "task", status: "pending", session_id: 10, computer_id: 4 });

        expect(waits()).toBe(false);
    });

    test("a queued run in a crew request or a silent hook's thread is not the user's wait", () => {
        db.run(`INSERT INTO bot_sessions VALUES (10, 1, NULL, NULL)`);
        db.run(`INSERT INTO bot_sessions VALUES (11, 1, 3, NULL)`);
        db.run(`INSERT INTO bot_hooks VALUES (2, 1)`);
        db.run(`INSERT INTO bot_sessions VALUES (12, 1, NULL, 2)`);
        job({ id: 1, kind: "task", status: "processing", session_id: 10, computer_id: 4 });
        job({ id: 2, kind: "task", status: "pending", session_id: 11, computer_id: 4 });
        job({ id: 3, kind: "task", status: "pending", session_id: 12, computer_id: 4 });

        expect(waits()).toBe(false);
    });
});