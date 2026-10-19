import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import chatBotsSql from "./chat-bots-sql";
import computersSql from "./computers-sql";
import workspaceBotsSql from "./workspace-bots-sql";
import workspacesSql from "./workspaces-sql";
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
    db.run(`INSERT INTO workspace_bots VALUES (11, 3)`);
    db.run(`CREATE TABLE computers (id INTEGER PRIMARY KEY)`);
    db.run(`CREATE TABLE workspace_computers (workspace_id INTEGER, computer_id INTEGER)`);
    db.run(`CREATE TABLE bot_computers (bot_id INTEGER, computer_id INTEGER)`);
    db.run(`INSERT INTO computers VALUES (20), (21), (22), (23)`);
    db.run(`INSERT INTO workspace_computers VALUES (11, 21), (10, 23)`);
    db.run(`INSERT INTO bot_computers VALUES (1, 20), (2, 22)`);
});

function ids({ table, alias, condition }: { table: string; alias: string; condition: SqlCondition }) {
    return db
        .query(`SELECT ${alias}.id FROM ${table} ${alias} WHERE ${condition.sql} ORDER BY ${alias}.id`)
        .all(...condition.values)
        .map((row) => (row as { id: number }).id);
}

describe("chatBotsSql", () => {
    test("the super admin chats with every bot, the coordinator too", () => {
        expect(ids({ table: "bots", alias: "b", condition: chatBotsSql({ role: "super_admin", user_id: 1 }) })).toEqual([1, 2, 3]);
    });

    test("an admin chats with every worker, never the coordinator", () => {
        expect(ids({ table: "bots", alias: "b", condition: chatBotsSql({ role: "admin", user_id: 5 }) })).toEqual([2, 3]);
    });

    test("a member only with workers assigned to them, even if the coordinator was", () => {
        expect(ids({ table: "bots", alias: "b", condition: chatBotsSql({ role: "member", user_id: 7 }) })).toEqual([2]);
        expect(ids({ table: "bots", alias: "b", condition: chatBotsSql({ role: "member", user_id: 8 }) })).toEqual([]);
        expect(ids({ table: "bots", alias: "b", condition: chatBotsSql({ role: "member", user_id: 9 }) })).toEqual([3]);
    });
});

describe("workspacesSql", () => {
    test("managers reach every workspace, members only theirs", () => {
        expect(ids({ table: "workspaces", alias: "w", condition: workspacesSql({ role: "admin", user_id: 5 }) })).toEqual([10, 11]);
        expect(ids({ table: "workspaces", alias: "w", condition: workspacesSql({ role: "member", user_id: 7 }) })).toEqual([11]);
        expect(ids({ table: "workspaces", alias: "w", condition: workspacesSql({ role: "member", user_id: 8 }) })).toEqual([]);
    });
});

describe("workspaceBotsSql", () => {
    test("the coordinator joins the workspace's workers for the super admin only", () => {
        expect(ids({ table: "bots", alias: "b", condition: workspaceBotsSql({ role: "super_admin", workspace_id: 11 }) })).toEqual([1, 3]);
        expect(ids({ table: "bots", alias: "b", condition: workspaceBotsSql({ role: "admin", workspace_id: 11 }) })).toEqual([3]);
        expect(ids({ table: "bots", alias: "b", condition: workspaceBotsSql({ role: "member", workspace_id: 11 }) })).toEqual([3]);
        expect(ids({ table: "bots", alias: "b", condition: workspaceBotsSql({ role: "member", workspace_id: 10 }) })).toEqual([]);
    });
});

describe("computersSql", () => {
    test("managers see every computer, members those of their bots, never the coordinator's", () => {
        expect(ids({ table: "computers", alias: "c", condition: computersSql({ role: "admin", user_id: 5 }) })).toEqual([20, 21, 22, 23]);
        expect(ids({ table: "computers", alias: "c", condition: computersSql({ role: "member", user_id: 7 }) })).toEqual([21, 22]);
        expect(ids({ table: "computers", alias: "c", condition: computersSql({ role: "member", user_id: 8 }) })).toEqual([]);
    });

    test("a member sees the computers of the workspaces their assigned workers are in", () => {
        expect(ids({ table: "computers", alias: "c", condition: computersSql({ role: "member", user_id: 9 }) })).toEqual([21]);
    });
});
