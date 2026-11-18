import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import followedSessionSql from "./followed-session-sql";

/**
 * What counts as the user's own activity: every session but a crew
 * request's and a silent hook's thread. Run against real SQLite, since the
 * rule is the SQL itself.
 */
const db = new Database(":memory:");

db.run(
    `CREATE TABLE bot_hooks (id INTEGER PRIMARY KEY, silent INTEGER)`,
);
db.run(`INSERT INTO bot_hooks VALUES (4, 1), (5, 0)`);
db.run(
    `CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, title TEXT, ask_id INTEGER, hook_id INTEGER, routine_id INTEGER)`,
);
db.run(`INSERT INTO bot_sessions VALUES
    (1, 'The chat', NULL, NULL, NULL),
    (2, 'A crew request', 3, NULL, NULL),
    (3, 'A silent hook', NULL, 4, NULL),
    (4, 'A hook that talks', NULL, 5, NULL),
    (5, 'A routine', NULL, NULL, 9)`);

function ids(alias?: string) {
    const sql = `SELECT id FROM bot_sessions${alias ? ` ${alias}` : ""} WHERE ${followedSessionSql(alias ? { alias } : {})} ORDER BY id`;

    return (db.query(sql).all() as { id: number }[]).map((row) => row.id);
}

describe("followedSessionSql", () => {
    test("keeps the chat, a routine's thread and a hook that isn't silent", () => {
        expect(ids()).toEqual([1, 4, 5]);
    });

    test("leaves out a crew request and a silent hook's thread", () => {
        expect(ids()).not.toContain(2);
        expect(ids()).not.toContain(3);
    });

    test("reads the alias it's given, for queries that join sessions", () => {
        expect(ids("s")).toEqual([1, 4, 5]);
    });

    test("a session whose hook is gone is the user's again", () => {
        db.run(`INSERT INTO bot_sessions VALUES (6, 'A detached hook thread', NULL, 99, NULL)`);

        expect(ids()).toEqual([1, 4, 5, 6]);

        db.run(`DELETE FROM bot_sessions WHERE id = 6`);
    });
});