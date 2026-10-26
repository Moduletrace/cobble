import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import searchPastSessionsSql, { type SearchPastSessionsParams } from "./past-session-messages-sql";

/**
 * A bot's search of its earlier sessions reads only that user's
 * conversation with it (in the same place), never the session it's
 * answering. Run against real SQLite.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, user_id INTEGER, bot_id INTEGER, workspace_id INTEGER, title TEXT)`);
db.run(`CREATE TABLE bot_messages (id INTEGER PRIMARY KEY, session_id INTEGER, author TEXT, text TEXT, created_at INTEGER)`);
db.run(`INSERT INTO bot_sessions VALUES
    (1, 1, 10, NULL, 'Invoices'),
    (2, 1, 10, NULL, 'Current'),
    (3, 2, 10, NULL, 'Another user'),
    (4, 1, 11, NULL, 'Another bot'),
    (5, 1, 10, 7, 'In a workspace')`);
db.run(`INSERT INTO bot_messages (id, session_id, author, text) VALUES
    (1, 1, 'user', 'Send the Acme invoice to billing@acme.test'),
    (2, 1, 'bot', 'Done: invoice INV-42 sent to Acme.'),
    (3, 2, 'user', 'What happened with the Acme invoice?'),
    (4, 3, 'user', 'Acme invoice for someone else'),
    (5, 4, 'user', 'Acme invoice to another bot'),
    (6, 5, 'user', 'Acme invoice in the workspace'),
    (7, 1, 'user', 'Discount of 100% off'),
    (8, 1, 'user', 'Discount of 10 off')`);

function ids(params: Partial<SearchPastSessionsParams>) {
    const { sql, values } = searchPastSessionsSql({
        user_id: 1,
        bot_id: 10,
        current_session_id: 2,
        query: "",
        ...params,
    });

    return (db.query(sql).all(...values) as { id: number }[]).map((row) => row.id);
}

describe("searchPastSessionsSql", () => {
    test("finds only this conversation's earlier sessions, newest first", () => {
        expect(ids({ query: "acme invoice" })).toEqual([2, 1]);
    });

    test("keeps the workspace's conversation apart from the bot's own chat", () => {
        expect(ids({ query: "acme", workspace_id: 7, current_session_id: 99 })).toEqual([6]);
    });

    test("every word must match", () => {
        expect(ids({ query: "invoice INV-42" })).toEqual([2]);
    });

    test("% matches only itself", () => {
        expect(ids({ query: "100%" })).toEqual([7]);
    });

    test("pages with before_id", () => {
        expect(ids({ query: "acme", before_id: 2 })).toEqual([1]);
    });

    test("cuts the text around the match", () => {
        const { sql, values } = searchPastSessionsSql({
            user_id: 1,
            bot_id: 10,
            current_session_id: 2,
            query: "billing",
            snippet_chars: 12,
        });
        const row = db.query(sql).get(...values) as { snippet: string; session_title: string };

        expect(row.snippet).toContain("billing");
        expect(row.snippet.length).toBeLessThanOrEqual(12);
        expect(row.session_title).toBe("Invoices");
    });
});
