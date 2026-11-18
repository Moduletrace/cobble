import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { ReleaseRestingBotJobsSql } from "./release-resting-bot-jobs-sql";

const db = new Database(":memory:");
const now = 1_800_000_000_000;

beforeEach(() => {
    db.run(`DROP TABLE IF EXISTS bots_queue`);
    db.run(`CREATE TABLE bots_queue (
        id INTEGER PRIMARY KEY,
        status TEXT NOT NULL,
        available_at INTEGER NOT NULL,
        last_error TEXT,
        updated_at INTEGER
    )`);
});

function insert(row: {
    id: number;
    status: string;
    available_at: number;
    last_error?: string | null;
    updated_at?: number;
}) {
    db.run(
        `INSERT INTO bots_queue (id, status, available_at, last_error, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [row.id, row.status, row.available_at, row.last_error ?? null, row.updated_at ?? 0],
    );
}

function available(id: number) {
    return db.query(`SELECT available_at FROM bots_queue WHERE id = ?`).get(id) as {
        available_at: number;
    };
}

function release() {
    return db.query(ReleaseRestingBotJobsSql).all(now, now, now) as { id: number }[];
}

/**
 * A job parked on a model rest must wake when the benches it waited on are
 * gone (a run-limits save, a restart), while a job backing off a real failure
 * keeps its delay and work in flight is left alone.
 */
describe("ReleaseRestingBotJobsSql", () => {
    test("wakes a pending job parked by a rest", () => {
        insert({ id: 1, status: "pending", available_at: now + 86_400_000 });

        const woken = release();

        expect(woken.map((row) => row.id)).toEqual([1]);
        expect(available(1).available_at).toBe(now);
    });

    test("leaves a job backing off a real failure", () => {
        insert({ id: 2, status: "pending", available_at: now + 60_000, last_error: "Provider is down" });

        expect(release()).toEqual([]);
        expect(available(2).available_at).toBe(now + 60_000);
    });

    test("leaves work in flight, and a job already available", () => {
        insert({ id: 3, status: "processing", available_at: now + 86_400_000 });
        insert({ id: 4, status: "pending", available_at: now - 1_000 });

        expect(release()).toEqual([]);
        expect(available(3).available_at).toBe(now + 86_400_000);
        expect(available(4).available_at).toBe(now - 1_000);
    });

    test("wakes every parked job at once", () => {
        insert({ id: 5, status: "pending", available_at: now + 86_400_000 });
        insert({ id: 6, status: "pending", available_at: now + 3_600_000 });
        insert({ id: 7, status: "failed", available_at: now + 86_400_000 });

        expect(release().map((row) => row.id).sort()).toEqual([5, 6]);
        expect(available(5).available_at).toBe(now);
        expect(available(6).available_at).toBe(now);
        expect(available(7).available_at).toBe(now + 86_400_000);
    });
});