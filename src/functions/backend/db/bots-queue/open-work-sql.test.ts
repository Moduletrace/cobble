import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import openWorkSql from "./open-work-sql";

const db = new Database(":memory:");

beforeEach(() => {
    db.run(`CREATE TABLE IF NOT EXISTS bots_queue (
        id INTEGER PRIMARY KEY,
        status TEXT,
        kind TEXT,
        bot_id INTEGER,
        session_id INTEGER,
        requested_by_session_id INTEGER,
        params TEXT
    )`);
    db.run(`DELETE FROM bots_queue`);
});

function insert(row: {
    id: number;
    status: string;
    kind: string;
    bot_id: number;
    session_id: number;
    requested_by_session_id?: number | null;
    params?: string | null;
}) {
    db.run(
        `INSERT INTO bots_queue (id, status, kind, bot_id, session_id, requested_by_session_id, params)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            row.id,
            row.status,
            row.kind,
            row.bot_id,
            row.session_id,
            row.requested_by_session_id ?? null,
            row.params ?? null,
        ],
    );
}

function found(bot_id: number, session_id: number, exclude_job_id?: number) {
    const condition = openWorkSql({ bot_id, session_id, exclude_job_id });

    return db.query(condition.sql).all(...condition.values).map((row) => (row as { id: number }).id);
}

describe("openWorkSql", () => {
    test("a queued task of the bot in the session is open work", () => {
        insert({ id: 1, status: "pending", kind: "task", bot_id: 1, session_id: 5 });

        expect(found(1, 5)).toEqual([1]);
    });

    test("a plan-step reply job is open work (L5)", () => {
        insert({ id: 2, status: "processing", kind: "reply", bot_id: 1, session_id: 5, params: `{"plan_id":9}` });

        expect(found(1, 5)).toEqual([2]);
    });

    test("a plain reply with no plan is not open work", () => {
        insert({ id: 3, status: "pending", kind: "reply", bot_id: 1, session_id: 5, params: `{}` });

        expect(found(1, 5)).toEqual([]);
    });

    test("a routine reply (schedule_id, no plan_id) is not open work", () => {
        insert({ id: 7, status: "pending", kind: "reply", bot_id: 1, session_id: 5, params: `{"schedule_id":3}` });

        expect(found(1, 5)).toEqual([]);
    });

    test("a completed task is not open work", () => {
        insert({ id: 5, status: "completed", kind: "task", bot_id: 1, session_id: 5 });

        expect(found(1, 5)).toEqual([]);
    });

    test("a job handed over from the session is open work", () => {
        insert({ id: 6, status: "pending", kind: "task", bot_id: 2, session_id: 9, requested_by_session_id: 5 });

        expect(found(1, 5)).toEqual([6]);
    });

    test("a plan step in another session is not this session's open work", () => {
        insert({ id: 4, status: "processing", kind: "reply", bot_id: 1, session_id: 6, params: `{"plan_id":9}` });

        expect(found(1, 5)).toEqual([]);
    });

    /**
     * A task run's own job is `processing` while it writes its report, so
     * without this a report saying work is under way would count itself as
     * the work and pass the review.
     */
    test("the run's own job is not open work", () => {
        insert({ id: 8, status: "processing", kind: "task", bot_id: 1, session_id: 5 });
        insert({ id: 9, status: "pending", kind: "task", bot_id: 1, session_id: 5 });

        expect(found(1, 5, 8)).toEqual([9]);
        expect(found(1, 5).length).toBe(1);
    });
});