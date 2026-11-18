import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import adoptHookSessionSql from "./adopt-hook-session-sql";

/**
 * Run against real SQLite: a wrong condition would either leave the user's
 * own conversation unattended (pushed nowhere, no unread, no face) or take
 * a hook that isn't silent out of the conversation it is meant to be in.
 */
const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE bot_hooks (id INTEGER PRIMARY KEY, silent INTEGER)`);
    db.run(`CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, hook_id INTEGER, updated_at INTEGER)`);
    db.run(`INSERT INTO bot_hooks VALUES (1, 1), (2, 0)`);
    db.run(`INSERT INTO bot_sessions VALUES
        (10, 1, 0),
        (11, 2, 0),
        (12, NULL, 0),
        (13, 99, 0)`);
});

function adopt(session_id: number) {
    const { sql, values } = adoptHookSessionSql({ session_id, now: 42 });

    return db.query(sql).all(...values).length > 0;
}

function hookOf(session_id: number) {
    return (db.query(`SELECT hook_id FROM bot_sessions WHERE id = ?`).get(session_id) as {
        hook_id: number | null;
    }).hook_id;
}

describe("adoptHookSessionSql", () => {
    test("takes a silent hook's thread from the hook", () => {
        expect(adopt(10)).toBe(true);
        expect(hookOf(10)).toBeNull();
        expect(db.query(`SELECT updated_at FROM bot_sessions WHERE id = 10`).get()).toEqual({ updated_at: 42 });
    });

    test("leaves a hook that isn't silent in its thread: the thread is the conversation", () => {
        expect(adopt(11)).toBe(false);
        expect(hookOf(11)).toBe(2);
    });

    test("leaves a session that belongs to no hook", () => {
        expect(adopt(12)).toBe(false);
    });

    test("leaves a session whose hook is gone", () => {
        expect(adopt(13)).toBe(false);
        expect(hookOf(13)).toBe(99);
    });
});