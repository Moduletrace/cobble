import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import openSessionRunsSql from "./open-session-runs-sql";

/**
 * The runs a reply is told hear the user: the bot's open task runs in the
 * session, never a routine's or a hook call's. Run against real SQLite.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bots_queue (id INTEGER PRIMARY KEY, bot_id INTEGER, session_id INTEGER, kind TEXT, status TEXT, title TEXT, params TEXT)`);
db.run(`INSERT INTO bots_queue VALUES
    (1, 10, 1, 'task', 'processing', 'Art directions', NULL),
    (2, 10, 1, 'task', 'pending', 'Logo', '{"max_steps":20}'),
    (3, 10, 1, 'reply', 'processing', NULL, NULL),
    (4, 10, 1, 'task', 'completed', 'Old run', NULL),
    (5, 10, 1, 'task', 'processing', 'Routine', '{"schedule_id":3}'),
    (6, 10, 1, 'task', 'pending', 'Hook call', '{"hook_id":4}'),
    (7, 11, 1, 'task', 'processing', 'Another bot', NULL),
    (8, 10, 2, 'task', 'processing', 'Another session', NULL)`);

function runs() {
    const { sql, values } = openSessionRunsSql({ bot_id: 10, session_id: 1 });

    return db.query(sql).all(...values) as { id: number; title: string; status: string }[];
}

describe("openSessionRunsSql", () => {
    test("lists the bot's open task runs in the session, oldest first", () => {
        expect(runs()).toEqual([
            { id: 1, title: "Art directions", status: "processing" },
            { id: 2, title: "Logo", status: "pending" },
        ]);
    });
});
