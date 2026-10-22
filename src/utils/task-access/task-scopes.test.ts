import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import botTaskScopesSql from "./bot-task-scopes-sql";
import taskScopesSql from "./task-scopes-sql";
import type { SqlCondition } from "./types";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE bots (id INTEGER PRIMARY KEY, kind TEXT)`);
    db.run(`CREATE TABLE workspaces (id INTEGER PRIMARY KEY, archived INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE bot_users (bot_id INTEGER, user_id INTEGER)`);
    db.run(`CREATE TABLE workspace_users (workspace_id INTEGER, user_id INTEGER)`);
    db.run(`CREATE TABLE workspace_bots (workspace_id INTEGER, bot_id INTEGER)`);
    db.run(`INSERT INTO bots VALUES (1, 'coordinator'), (2, 'worker'), (3, 'worker')`);
    db.run(`INSERT INTO workspaces VALUES (10, 0), (11, 0)`);
    db.run(`INSERT INTO bot_users VALUES (2, 7), (1, 7), (3, 9)`);
    db.run(`INSERT INTO workspace_users VALUES (11, 7)`);
    db.run(`INSERT INTO workspace_bots VALUES (11, 3), (10, 3)`);

    db.run(`CREATE TABLE tasks (id INTEGER PRIMARY KEY, bot_id INTEGER, workspace_id INTEGER)`);
    db.run(`INSERT INTO tasks VALUES
        (100, 1, NULL), (101, 2, NULL), (102, 3, NULL),
        (110, NULL, 10), (111, NULL, 11)`);
});

function ids({ condition }: { condition: SqlCondition }) {
    return db
        .query(`SELECT t.id FROM tasks t WHERE ${condition.sql} ORDER BY t.id`)
        .all(...condition.values)
        .map((row) => (row as { id: number }).id);
}

describe("taskScopesSql", () => {
    test("the super admin sees every task, the coordinator's and every workspace's", () => {
        expect(ids({ condition: taskScopesSql({ role: "super_admin", user_id: 1 }) })).toEqual([
            100, 101, 102, 110, 111,
        ]);
    });

    test("an admin sees every worker's own tasks and every workspace's, never the coordinator's", () => {
        expect(ids({ condition: taskScopesSql({ role: "admin", user_id: 5 }) })).toEqual([101, 102, 110, 111]);
    });

    test("a member sees only their assigned bots' own tasks and their workspaces'", () => {
        expect(ids({ condition: taskScopesSql({ role: "member", user_id: 7 }) })).toEqual([101, 111]);
        expect(ids({ condition: taskScopesSql({ role: "member", user_id: 8 }) })).toEqual([]);
        expect(ids({ condition: taskScopesSql({ role: "member", user_id: 9 }) })).toEqual([102]);
    });
});

describe("botTaskScopesSql", () => {
    test("a worker reaches its own tasks and those of every workspace it works in", () => {
        expect(ids({ condition: botTaskScopesSql({ bot_id: 3, is_coordinator: false }) })).toEqual([102, 110, 111]);
        expect(ids({ condition: botTaskScopesSql({ bot_id: 2, is_coordinator: false }) })).toEqual([101]);
    });

    test("the coordinator reaches every task in the install", () => {
        expect(ids({ condition: botTaskScopesSql({ bot_id: 1, is_coordinator: true }) })).toEqual([
            100, 101, 102, 110, 111,
        ]);
    });
});
