import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { runTaskSql, taskRowSql } from "./run-task-sql";

/**
 * What a bot's run may read: its own list, what it has in the workspaces it
 * still works in, and the workspace-wide tasks there. The coordinator
 * reaches everything. Run against real SQLite.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT, bot_id INTEGER, workspace_id INTEGER, status TEXT)`);
db.run(`CREATE TABLE workspace_bots (workspace_id INTEGER, bot_id INTEGER)`);
db.run(`INSERT INTO tasks VALUES
    (1, 'Its own list', 10, NULL, 'todo'),
    (2, 'Another bot''s list', 11, NULL, 'todo'),
    (3, 'Its own, in a workspace', 10, 5, 'todo'),
    (4, 'Workspace-wide, in a workspace it works in', NULL, 5, 'todo'),
    (5, 'Another bot''s, in a workspace it left', 11, 6, 'todo'),
    (6, 'Workspace-wide, in a workspace it left', NULL, 7, 'todo'),
    (7, 'Another bot''s, in a workspace it works in', 11, 5, 'todo')`);
db.run(`INSERT INTO workspace_bots VALUES (5, 10)`);

function task(bot_id: number, task_id: number, options: { is_coordinator?: boolean; admin_workspace_ids?: number[] } = {}) {
    const { sql, values } = runTaskSql({ task_id, bot_id, is_coordinator: options.is_coordinator ?? false, admin_workspace_ids: options.admin_workspace_ids });

    return db.query(sql).get(...values) as { id: number } | null;
}

describe("runTaskSql", () => {
    test("a worker reaches its own list", () => {
        expect(task(10, 1)?.id).toBe(1);
    });

    test("and its own task in a workspace it works in, and that workspace's wide one", () => {
        expect(task(10, 3)?.id).toBe(3);
        expect(task(10, 4)?.id).toBe(4);
    });

    test("never another bot's task, even in a workspace they share", () => {
        expect(task(10, 7)).toBeNull();
    });

    test("never another bot's own list", () => {
        expect(task(10, 2)).toBeNull();
    });

    test("never a workspace it doesn't work in", () => {
        expect(task(10, 5)).toBeNull();
        expect(task(10, 6)).toBeNull();
    });

    test("the coordinator reaches every task, whoever has it", () => {
        expect(task(1, 2, { is_coordinator: true })?.id).toBe(2);
        expect(task(1, 5, { is_coordinator: true })?.id).toBe(5);
        expect(task(1, 6, { is_coordinator: true })?.id).toBe(6);
    });

    test("a workspace admin reaches every task in its workspace", () => {
        expect(task(10, 5, { admin_workspace_ids: [6] })?.id).toBe(5);
        expect(task(10, 6, { admin_workspace_ids: [6] })).toBeNull();
    });
});

describe("taskRowSql", () => {
    test("says whether a task is there at all", () => {
        const there = taskRowSql({ task_id: 2 });
        const gone = taskRowSql({ task_id: 99 });

        expect(db.query(there.sql).get(...there.values)).toEqual({ id: 2 });
        expect(db.query(gone.sql).get(...gone.values)).toBeNull();
    });
});
