import { Database, type SQLQueryBindings } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { replacePendingExtensionProposalsSql } from "./replace-pending-extension-proposals";

/**
 * Run against real SQLite: the point of the statement is which rows it
 * leaves alone. Production kept proposal #41 (Co-Marketing, session 145)
 * pending for ever while #42 made the same skill in session 146, and
 * RevOps was proposed four times under two names, all slug `revops`.
 */
function fresh() {
    const db = new Database(":memory:");

    db.run(`CREATE TABLE extension_proposals (
        id INTEGER PRIMARY KEY,
        name TEXT,
        data TEXT,
        extension_id INTEGER,
        kind TEXT,
        status TEXT,
        outcome TEXT,
        decided_at INTEGER,
        updated_at INTEGER,
        user_id INTEGER,
        bot_id INTEGER,
        session_id INTEGER,
        workspace_id INTEGER
    )`);

    const insert = db.prepare(`INSERT INTO extension_proposals
        (id, name, data, extension_id, kind, status, user_id, bot_id, session_id, workspace_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    insert.run(41, "Co-Marketing", `{"slug":"co-marketing"}`, null, "skill", "pending", 1, 1, 145, null);
    insert.run(42, "Co-Marketing", `{"slug":"co-marketing"}`, null, "skill", "confirmed", 1, 1, 146, null);
    insert.run(43, "Referrals & Affiliates", `{"slug":"referrals"}`, null, "skill", "confirmed", 1, 1, 145, null);
    insert.run(44, "Referrals", `{"slug":"referrals"}`, null, "skill", "failed", 1, 1, 146, null);
    insert.run(62, "RevOps", `{"slug":"revops"}`, null, "skill", "pending", 1, 1, 146, null);
    insert.run(63, "Revenue Operations (RevOps)", `{"slug":"revops"}`, null, "skill", "confirmed", 1, 1, 146, null);
    insert.run(70, "Lead Magnets", `{"slug":"lead-magnets"}`, null, "skill", "pending", 1, 1, 146, null);
    insert.run(71, "Link Building", `{"slug":"link-building"}`, 12, "skill", "pending", 1, 1, 146, null);
    insert.run(72, "Some Server", `{}`, null, "mcp", "pending", 1, 1, 146, null);
    insert.run(73, "Some Server", `{}`, null, "mcp", "pending", 2, 1, 146, null);
    insert.run(74, "Some Server", `{}`, null, "mcp", "pending", 1, 1, 146, 3);
    insert.run(75, "Fetch Tool", `{}`, null, "tool", "pending", 1, 1, 146, null);
    insert.run(76, "Changed Tool", `{}`, 9, "tool", "pending", 1, 1, 146, null);
    insert.run(77, "Another Tool", `{}`, 10, "tool", "pending", 1, 1, 146, null);

    return db;
}

function replace(
    db: Database,
    params: Parameters<typeof replacePendingExtensionProposalsSql>[0],
) {
    const { sql, values } = replacePendingExtensionProposalsSql(params);

    db.run(sql, values as SQLQueryBindings[]);
}

const statuses = (db: Database) =>
    Object.fromEntries(
        (db.query(`SELECT id, status FROM extension_proposals`).all() as { id: number; status: string }[]).map((row) => [
            row.id,
            row.status,
        ]),
    );

describe("replacePendingExtensionProposalsSql", () => {
    test("replaces a skill proposed again in a later session of the same conversation", () => {
        const db = fresh();

        replace(db, {
            proposal_id: 63,
            user_id: 1,
            bot_id: 1,
            kind: "skill",
            slug: "revops",
            name: "Revenue Operations (RevOps)",
        });

        const status = statuses(db);

        expect(status[62]).toBe("replaced");
        expect(status[63]).toBe("confirmed");
        expect(status[70]).toBe("pending");
        expect(status[41]).toBe("pending");
    });

    test("does not mark a skill's proposal replaced by another skill's", () => {
        const db = fresh();

        replace(db, {
            proposal_id: 70,
            user_id: 1,
            bot_id: 1,
            kind: "skill",
            slug: "lead-magnets",
            name: "Lead Magnets",
        });

        const status = statuses(db);

        expect(status[62]).toBe("pending");
        expect(status[71]).toBe("pending");
        expect(Object.values(status).filter((value) => value == "replaced")).toEqual([]);
    });

    test("a server compares the name when the proposal changes nothing yet", () => {
        const db = fresh();

        replace(db, {
            proposal_id: 78,
            user_id: 1,
            bot_id: 1,
            kind: "mcp",
            name: "Some Server",
        });

        const status = statuses(db);

        expect(status[72]).toBe("replaced");
        expect(status[73]).toBe("pending");
        expect(status[74]).toBe("pending");
    });

    test("a tool compares the extension it changes", () => {
        const db = fresh();

        replace(db, {
            proposal_id: 78,
            user_id: 1,
            bot_id: 1,
            kind: "tool",
            extension_id: 9,
            name: "Changed Tool",
        });

        const status = statuses(db);

        expect(status[76]).toBe("replaced");
        expect(status[75]).toBe("pending");
        expect(status[77]).toBe("pending");
    });
});