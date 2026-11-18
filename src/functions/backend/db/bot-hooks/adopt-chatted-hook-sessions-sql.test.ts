import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import adoptChattedHookSessionsSql from "./adopt-chatted-hook-sessions-sql";

/**
 * Run against real SQLite: the boot repair has to take exactly the threads
 * the user was chatting in and leave the hook's own runs (silent, no user
 * in them) and every hook that isn't silent alone.
 */
const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE bot_hooks (id INTEGER PRIMARY KEY, silent INTEGER)`);
    db.run(`CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, hook_id INTEGER, status TEXT, updated_at INTEGER)`);
    db.run(
        `CREATE TABLE bot_messages (id INTEGER PRIMARY KEY, session_id INTEGER, author TEXT, from_ask_id INTEGER, from_install_request_id INTEGER)`,
    );
    db.run(`INSERT INTO bot_hooks VALUES (1, 1), (2, 0)`);
    db.run(`INSERT INTO bot_sessions VALUES
        (10, 1, 'active', 0),
        (11, 1, 'closed', 0),
        (12, 1, 'closed', 0),
        (13, 1, 'closed', 0),
        (14, 1, 'closed', 0),
        (15, 2, 'active', 0),
        (16, NULL, 'active', 0),
        (17, 1, 'closed', 0)`);
    db.run(`INSERT INTO bot_messages VALUES
        (100, 11, 'user', NULL, NULL),
        (101, 12, 'bot', NULL, NULL),
        (102, 13, 'user', 4, NULL),
        (103, 14, 'user', NULL, 2),
        (104, 15, 'user', NULL, NULL),
        (105, 16, 'user', NULL, NULL),
        (106, 17, 'user', NULL, NULL),
        (107, 17, 'bot', NULL, NULL)`);
});

function adopt() {
    const { sql, values } = adoptChattedHookSessionsSql({ now: 42 });

    return (db.query(sql).all(...values) as { id: number }[]).map((row) => row.id).sort((a, b) => a - b);
}

function hookOf(session_id: number) {
    return (db.query(`SELECT hook_id FROM bot_sessions WHERE id = ?`).get(session_id) as {
        hook_id: number | null;
    }).hook_id;
}

describe("adoptChattedHookSessionsSql", () => {
    test("hands back the threads the user was in, and only those", () => {
        expect(adopt()).toEqual([10, 11, 17]);

        expect(hookOf(10)).toBeNull();
        expect(hookOf(11)).toBeNull();
        expect(hookOf(17)).toBeNull();

        expect(hookOf(12)).toBe(1);
        expect(hookOf(13)).toBe(1);
        expect(hookOf(14)).toBe(1);
        expect(hookOf(15)).toBe(2);
        expect(hookOf(16)).toBeNull();
    });

    test("changes nothing on the next boot", () => {
        expect(adopt()).toEqual([]);
    });
});