import { Database, type SQLQueryBindings } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { replacePendingHookProposalsSql } from "./replace-pending-hook-proposals";

/**
 * A conversation carried into a new session keeps proposing into it, so a
 * pending card for the same hook (or the same new name) is marked replaced
 * across sessions, never left for the user to press after its outcome was
 * written.
 */
function fresh() {
    const db = new Database(":memory:");

    db.run(`CREATE TABLE hook_proposals (
        id INTEGER PRIMARY KEY,
        hook_id INTEGER,
        title TEXT,
        status TEXT,
        outcome TEXT,
        decided_at INTEGER,
        updated_at INTEGER,
        user_id INTEGER,
        bot_id INTEGER,
        session_id INTEGER,
        workspace_id INTEGER
    )`);

    const insert = db.prepare(`INSERT INTO hook_proposals
        (id, hook_id, title, status, user_id, bot_id, session_id, workspace_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    insert.run(1, null, "Inbox Digest", "pending", 1, 1, 145, null);
    insert.run(2, null, "inbox digest", "pending", 1, 1, 146, null);
    insert.run(3, null, "Inbox Digest", "confirmed", 1, 1, 146, null);
    insert.run(4, 7, "Nightly Build", "pending", 1, 1, 146, null);
    insert.run(5, 8, "Nightly Build", "pending", 1, 1, 146, null);
    insert.run(6, null, "Inbox Digest", "pending", 2, 1, 146, null);

    return db;
}

function replace(db: Database, params: Parameters<typeof replacePendingHookProposalsSql>[0]) {
    const { sql, values } = replacePendingHookProposalsSql(params);

    db.run(sql, values as SQLQueryBindings[]);
}

const statuses = (db: Database) =>
    Object.fromEntries(
        (db.query(`SELECT id, status FROM hook_proposals`).all() as { id: number; status: string }[]).map((row) => [
            row.id,
            row.status,
        ]),
    );

describe("replacePendingHookProposalsSql", () => {
    test("replaces a new hook proposed again under the same name in a later session", () => {
        const db = fresh();

        replace(db, { proposal_id: 2, user_id: 1, bot_id: 1, title: "inbox digest" });

        const status = statuses(db);

        expect(status[1]).toBe("replaced");
        expect(status[3]).toBe("confirmed");
        expect(status[6]).toBe("pending");
        expect(status[4]).toBe("pending");
    });

    test("a hook that exists is compared by the hook, not by its title", () => {
        const db = fresh();

        replace(db, { proposal_id: 9, user_id: 1, bot_id: 1, hook_id: 7, title: "Nightly Build" });

        const status = statuses(db);

        expect(status[4]).toBe("replaced");
        expect(status[5]).toBe("pending");
        expect(status[1]).toBe("pending");
    });
});