import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import clearFinishedJobStepsSql from "./clear-finished-job-steps-sql";

/**
 * Clearing a finished job's steps must keep their count on the job (the
 * message details show it) and never touch a job that can still run: its
 * working row reads them.
 */
function setup() {
    const db = new Database(":memory:");

    db.run(
        `CREATE TABLE bots_queue (id INTEGER PRIMARY KEY, status TEXT, finished_at INTEGER, updated_at INTEGER, steps INTEGER)`,
    );
    db.run(`CREATE TABLE bots_queue_updates (id INTEGER PRIMARY KEY, bots_queue_id INTEGER)`);
    db.run(`INSERT INTO bots_queue VALUES
        (1, 'completed', 100, 100, NULL),
        (2, 'failed', 100, 100, NULL),
        (3, 'processing', NULL, 100, NULL),
        (4, 'pending', NULL, 100, NULL),
        (5, 'completed', 900, 900, NULL),
        (6, 'failed', NULL, 100, NULL),
        (7, 'completed', 100, 100, NULL)`);
    db.run(`INSERT INTO bots_queue_updates (bots_queue_id) VALUES (1), (1), (1), (2), (3), (3), (4), (5), (6)`);

    return db;
}

function run({ db, before }: { db: Database; before: number }) {
    const { count, clear } = clearFinishedJobStepsSql({ before });

    db.query(count.sql).run(...count.values);
    db.query(clear.sql).run(...clear.values);
}

function stepsLeft({ db }: { db: Database }) {
    return db
        .query(`SELECT bots_queue_id AS id FROM bots_queue_updates ORDER BY id`)
        .all()
        .map((row) => (row as { id: number }).id);
}

function counts({ db }: { db: Database }) {
    return Object.fromEntries(
        db
            .query(`SELECT id, steps FROM bots_queue ORDER BY id`)
            .all()
            .map((row) => [(row as { id: number }).id, (row as { steps: number | null }).steps]),
    );
}

describe("clearFinishedJobStepsSql", () => {
    test("clears the steps of jobs that ended before the cutoff, completed or failed", () => {
        const db = setup();
        run({ db, before: 500 });
        expect(stepsLeft({ db })).not.toContain(1);
        expect(stepsLeft({ db })).not.toContain(2);
    });

    test("keeps how many steps each job recorded", () => {
        const db = setup();
        run({ db, before: 500 });
        expect(counts({ db })[1]).toBe(3);
        expect(counts({ db })[2]).toBe(1);
    });

    test("never touches a job that can still run", () => {
        const db = setup();
        run({ db, before: 500 });
        expect(stepsLeft({ db })).toEqual([3, 3, 4, 5]);
        expect(counts({ db })[3]).toBeNull();
        expect(counts({ db })[4]).toBeNull();
    });

    test("leaves a job that ended after the cutoff for the next sweep", () => {
        const db = setup();
        run({ db, before: 500 });
        expect(counts({ db })[5]).toBeNull();
        run({ db, before: 1000 });
        expect(stepsLeft({ db })).not.toContain(5);
        expect(counts({ db })[5]).toBe(1);
    });

    test("a job lost without a finish time is still cleared by when it last changed", () => {
        const db = setup();
        run({ db, before: 500 });
        expect(stepsLeft({ db })).not.toContain(6);
        expect(counts({ db })[6]).toBe(1);
    });

    test("a job with no steps keeps a null count, and a second sweep changes nothing", () => {
        const db = setup();
        run({ db, before: 500 });
        run({ db, before: 500 });
        expect(counts({ db })[7]).toBeNull();
        expect(counts({ db })[1]).toBe(3);
    });
});
