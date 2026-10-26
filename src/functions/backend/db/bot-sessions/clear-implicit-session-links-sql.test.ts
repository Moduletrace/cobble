import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import clearImplicitSessionLinksSql from "./clear-implicit-session-links-sql";

/**
 * Only a carry-over keeps its link to the session before it. Run against
 * real SQLite.
 */
test("clears links without a carried-over message", () => {
    const db = new Database(":memory:");

    db.run(`CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, previous_session_id INTEGER)`);
    db.run(`CREATE TABLE bot_messages (id INTEGER PRIMARY KEY, session_id INTEGER, carried_from_session_id INTEGER)`);
    db.run(`INSERT INTO bot_sessions VALUES (1, NULL), (2, 1), (3, 2), (4, 3)`);
    db.run(`INSERT INTO bot_messages (id, session_id, carried_from_session_id) VALUES
        (1, 2, 1),
        (2, 3, NULL),
        (3, 4, 1)`);

    const { sql, values } = clearImplicitSessionLinksSql();

    db.query(sql).run(...values);

    const links = db.query(`SELECT id, previous_session_id FROM bot_sessions ORDER BY id`).all();

    expect(links).toEqual([
        { id: 1, previous_session_id: null },
        { id: 2, previous_session_id: 1 },
        { id: 3, previous_session_id: null },
        { id: 4, previous_session_id: null },
    ]);
});
