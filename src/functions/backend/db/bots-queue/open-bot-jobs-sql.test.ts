import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import openBotJobsSql from "./open-bot-jobs-sql";
import type { SqlCondition } from "@/src/utils/crew-access/types";

/**
 * What "stop the bot" pulls the plug on: a bot's open jobs for one user,
 * across every one of their conversations with it. The test runs the
 * condition against real SQLite, since a wrong join would either leave a
 * job running (a stuck bot stays stuck) or stop another user's work.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE bot_sessions (id INTEGER PRIMARY KEY, user_id INTEGER, bot_id INTEGER)`);
db.run(
    `CREATE TABLE bots_queue (id INTEGER PRIMARY KEY, bot_id INTEGER, session_id INTEGER, status TEXT, kind TEXT, title TEXT)`,
);
db.run(`INSERT INTO bot_sessions VALUES (100, 7, 2), (101, 7, 2), (102, 8, 2), (103, 9, 3)`);
db.run(`INSERT INTO bots_queue VALUES
    (1, 2, 100, 'pending', 'reply', 'Thinking'),
    (2, 2, 101, 'processing', 'task', 'The audit'),
    (3, 2, 102, 'processing', 'task', 'Another user''s job'),
    (4, 2, 100, 'completed', 'reply', 'Thinking'),
    (5, 2, 100, 'failed', 'task', 'An old failure'),
    (6, 3, 103, 'pending', 'reply', 'Thinking'),
    (7, 3, 103, 'processing', 'task', 'A finished bot''s job')`);

function ids(condition: SqlCondition) {
    return db
        .query(`SELECT q.id FROM bots_queue q WHERE ${condition.sql} ORDER BY q.id`)
        .all(...condition.values)
        .map((row) => (row as { id: number }).id);
}

describe("openBotJobsSql", () => {
    test("takes every open job of the bot across the user's conversations, tasks and replies alike", () => {
        expect(ids(openBotJobsSql({ bot_id: 2, user_id: 7 }))).toEqual([1, 2]);
    });

    test("never takes another user's job, even on the same bot", () => {
        expect(ids(openBotJobsSql({ bot_id: 2, user_id: 7 }))).not.toContain(3);
    });

    test("leaves finished jobs alone, so the work they did still counts", () => {
        expect(ids(openBotJobsSql({ bot_id: 2, user_id: 7 }))).not.toContain(4);
        expect(ids(openBotJobsSql({ bot_id: 2, user_id: 7 }))).not.toContain(5);
    });

    test("another bot's jobs are never in it", () => {
        expect(ids(openBotJobsSql({ bot_id: 2, user_id: 7 }))).not.toContain(6);
        expect(ids(openBotJobsSql({ bot_id: 3, user_id: 9 }))).toEqual([6, 7]);
    });

    test("a user with nothing open stops nothing", () => {
        expect(ids(openBotJobsSql({ bot_id: 2, user_id: 8 }))).toEqual([3]);
        expect(ids(openBotJobsSql({ bot_id: 2, user_id: 99 }))).toEqual([]);
    });

    test("reads a join alias when one is given", () => {
        const condition = openBotJobsSql({ bot_id: 2, user_id: 7, alias: "j" });

        expect(
            db
                .query(`SELECT j.id FROM bots_queue j WHERE ${condition.sql} ORDER BY j.id`)
                .all(...condition.values)
                .map((row) => (row as { id: number }).id),
        ).toEqual([1, 2]);
    });
});
