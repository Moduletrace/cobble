import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { chatroomUsageCallsSql, chatroomUsageFailuresSql } from "./chatroom-usage-sql";

type Call = {
    session_id: number | null;
    job_id: number | null;
    prompt_tokens: number;
    cached_tokens: number | null;
    completion_tokens: number;
    cost: number | null;
};

function seed() {
    const db = new Database(":memory:");

    db.run(`CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, bot_id INTEGER, chatroom_id INTEGER, hook_id INTEGER)`);
    db.run(`CREATE TABLE token_usages (id INTEGER PRIMARY KEY, bot_id INTEGER, session_id INTEGER, job_id INTEGER,
        prompt_tokens INTEGER, cached_tokens INTEGER, completion_tokens INTEGER, cost REAL)`);
    db.run(`CREATE TABLE harness_call_failures (id INTEGER PRIMARY KEY, bot_id INTEGER, session_id INTEGER, job_id INTEGER)`);

    /**
     * Room 1 has one hidden session per bot; 300 belongs to another room,
     * 400 to a bot's own conversation (no room), 500 to a hook's own.
     */
    db.run(`INSERT INTO bot_sessions VALUES
        (100, 10, 1, NULL), (200, 20, 1, NULL), (300, 10, 2, NULL), (400, 10, NULL, NULL), (500, 20, NULL, 3)`);

    let calls = 0;

    const addCall = ({ bot_id, call }: { bot_id: number; call: Call }) =>
        db.run(`INSERT INTO token_usages (id, bot_id, session_id, job_id, prompt_tokens, cached_tokens, completion_tokens, cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            ++calls,
            bot_id,
            call.session_id,
            call.job_id,
            call.prompt_tokens,
            call.cached_tokens,
            call.completion_tokens,
            call.cost,
        ]);

    let failures = 0;

    const addFailure = ({ bot_id, session_id }: { bot_id: number; session_id: number | null }) =>
        db.run(`INSERT INTO harness_call_failures (id, bot_id, session_id, job_id) VALUES (?, ?, ?, NULL)`, [
            ++failures,
            bot_id,
            session_id,
        ]);

    return { db, addCall, addFailure };
}

function callsByRoom({ db }: { db: Database }) {
    const { sql, values } = chatroomUsageCallsSql({ chatroom_ids: [1] });
    const rows = db.query(sql).all(...values) as {
        chatroom_id: number;
        bot_id: number;
        calls: number;
        prompt_tokens: number;
        cached_tokens: number;
        completion_tokens: number;
        cost: number;
    }[];

    return rows
        .map((row) => ({
            chatroom_id: Number(row.chatroom_id),
            bot_id: Number(row.bot_id),
            calls: Number(row.calls),
            prompt_tokens: Number(row.prompt_tokens),
            cached_tokens: Number(row.cached_tokens),
            completion_tokens: Number(row.completion_tokens),
            cost: Number(row.cost),
        }))
        .sort((a, b) => a.bot_id - b.bot_id);
}

function failuresByRoom({ db }: { db: Database }) {
    const { sql, values } = chatroomUsageFailuresSql({ chatroom_ids: [1] });
    const rows = db.query(sql).all(...values) as { chatroom_id: number; failed_calls: number }[];

    return rows.map((row) => ({ chatroom_id: Number(row.chatroom_id), failed_calls: Number(row.failed_calls) }));
}

describe("chatroomUsageCallsSql", () => {
    test("sums a room's calls by bot", () => {
        const { db, addCall } = seed();

        addCall({
            bot_id: 10,
            call: { session_id: 100, job_id: null, prompt_tokens: 100, cached_tokens: 40, completion_tokens: 20, cost: 0.5 },
        });
        addCall({
            bot_id: 10,
            call: { session_id: 100, job_id: null, prompt_tokens: 50, cached_tokens: null, completion_tokens: 10, cost: null },
        });
        addCall({
            bot_id: 20,
            call: { session_id: 200, job_id: 50, prompt_tokens: 300, cached_tokens: 0, completion_tokens: 100, cost: 1 },
        });

        expect(callsByRoom({ db })).toEqual([
            { chatroom_id: 1, bot_id: 10, calls: 2, prompt_tokens: 150, cached_tokens: 40, completion_tokens: 30, cost: 0.5 },
            { chatroom_id: 1, bot_id: 20, calls: 1, prompt_tokens: 300, cached_tokens: 0, completion_tokens: 100, cost: 1 },
        ]);
    });

    test("another room's, a bot's own conversation's and a hook's calls stay out", () => {
        const { db, addCall } = seed();

        const call = { job_id: null, prompt_tokens: 10, cached_tokens: null, completion_tokens: 5, cost: null };

        addCall({ bot_id: 10, call: { ...call, session_id: 100 } });
        addCall({ bot_id: 10, call: { ...call, session_id: 300 } });
        addCall({ bot_id: 10, call: { ...call, session_id: 400 } });
        addCall({ bot_id: 20, call: { ...call, session_id: 500 } });
        addCall({ bot_id: 10, call: { ...call, session_id: null } });

        expect(callsByRoom({ db })).toEqual([
            { chatroom_id: 1, bot_id: 10, calls: 1, prompt_tokens: 10, cached_tokens: 0, completion_tokens: 5, cost: 0 },
        ]);
    });

    test("rooms with no calls have no rows", () => {
        const { db } = seed();

        expect(callsByRoom({ db })).toEqual([]);
    });
});

describe("chatroomUsageFailuresSql", () => {
    test("counts a room's failed calls, still-running turns included", () => {
        const { db, addFailure } = seed();

        addFailure({ bot_id: 10, session_id: 100 });
        addFailure({ bot_id: 20, session_id: 200 });
        addFailure({ bot_id: 10, session_id: 300 });
        addFailure({ bot_id: 10, session_id: null });

        expect(failuresByRoom({ db })).toEqual([{ chatroom_id: 1, failed_calls: 2 }]);
    });
});