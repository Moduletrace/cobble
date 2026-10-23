import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import routineScopeSql from "./routine-scope-sql";
import type { SqlCondition } from "./types";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE cron_jobs (id INTEGER PRIMARY KEY, bot_id INTEGER, workspace_id INTEGER)`);
    db.run(`INSERT INTO cron_jobs VALUES
        (1, 2, NULL),
        (2, 2, 10),
        (3, 2, 11),
        (4, 3, NULL),
        (5, 3, 10)`);
});

function ids({ condition }: { condition: SqlCondition }) {
    return db
        .query(`SELECT c.id FROM cron_jobs c WHERE ${condition.sql} ORDER BY c.id`)
        .all(...condition.values)
        .map((row) => (row as { id: number }).id);
}

describe("routineScopeSql", () => {
    test("a bot's own chat holds only the routines that run nowhere", () => {
        expect(ids({ condition: routineScopeSql({ bot_id: 2 }) })).toEqual([1]);
        expect(ids({ condition: routineScopeSql({ bot_id: 3, workspace_id: null }) })).toEqual([4]);
    });

    test("a workspace holds only that bot's routines there", () => {
        expect(ids({ condition: routineScopeSql({ bot_id: 2, workspace_id: 10 }) })).toEqual([2]);
        expect(ids({ condition: routineScopeSql({ bot_id: 3, workspace_id: 10 }) })).toEqual([5]);
    });

    test("another bot's routines in the same workspace are not this conversation's", () => {
        expect(ids({ condition: routineScopeSql({ bot_id: 2, workspace_id: 11 }) })).toEqual([3]);
        expect(ids({ condition: routineScopeSql({ bot_id: 9, workspace_id: 11 }) })).toEqual([]);
    });

    test("a string id from a query string still matches", () => {
        expect(ids({ condition: routineScopeSql({ bot_id: "2", workspace_id: "10" }) })).toEqual([2]);
    });
});
