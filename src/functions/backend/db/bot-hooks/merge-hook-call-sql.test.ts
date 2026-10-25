import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import mergeHookCallSql from "./merge-hook-call-sql";

/**
 * A burst of hook calls makes one waiting run: a call joins the last run
 * only while it waits untried. Run against real SQLite, since a wrong
 * condition would either change the brief of a run already working or
 * pile every call into a run that is retrying.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bots_queue (id INTEGER PRIMARY KEY, status TEXT, attempts INTEGER, instructions TEXT, updated_at INTEGER)`);
db.run(`INSERT INTO bots_queue VALUES
    (1, 'pending', 0, 'Brief', 0),
    (2, 'processing', 1, 'Brief', 0),
    (3, 'pending', 1, 'Brief', 0),
    (4, 'completed', 1, 'Brief', 0),
    (5, 'pending', NULL, NULL, 0)`);

function merge(job_id: number) {
    const { sql, values } = mergeHookCallSql({ job_id, block: "CALL", now: 42 });

    return db.query(sql).all(...values).length > 0;
}

function brief(job_id: number) {
    return (db.query(`SELECT instructions FROM bots_queue WHERE id = ?`).get(job_id) as { instructions: string })
        .instructions;
}

describe("mergeHookCallSql", () => {
    test("joins a run still waiting, untried", () => {
        expect(merge(1)).toBe(true);
        expect(brief(1)).toBe("Brief\n\nAnother call came in before this run started:\n\nCALL");
        expect(merge(5)).toBe(true);
        expect(brief(5)).toContain("CALL");
    });

    test("leaves a working, retrying or finished run alone", () => {
        expect(merge(2)).toBe(false);
        expect(merge(3)).toBe(false);
        expect(merge(4)).toBe(false);
        expect(brief(2)).toBe("Brief");
        expect(brief(3)).toBe("Brief");
    });
});
