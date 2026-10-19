import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import botExtensionsSql from "./bot-extensions-sql";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE custom_tools (id INTEGER PRIMARY KEY, all_bots INTEGER, enabled INTEGER)`);
    db.run(`CREATE TABLE bot_custom_tools (bot_id INTEGER, custom_tool_id INTEGER)`);
    db.run(`CREATE TABLE workspace_custom_tools (workspace_id INTEGER, custom_tool_id INTEGER)`);
    /**
     * 1: every bot. 2: bot 5. 3: workspace 9. 4: every bot, off.
     * 5: nobody.
     */
    db.run(`INSERT INTO custom_tools VALUES (1, 1, 1), (2, 0, 1), (3, 0, 1), (4, 1, 0), (5, 0, 1)`);
    db.run(`INSERT INTO bot_custom_tools VALUES (5, 2)`);
    db.run(`INSERT INTO workspace_custom_tools VALUES (9, 3)`);
});

function ids(params: Parameters<typeof botExtensionsSql>[0]) {
    const { sql, values } = botExtensionsSql(params);
    return db
        .query(sql)
        .all(...values)
        .map((row) => (row as { id: number }).id);
}

describe("botExtensionsSql", () => {
    test("a bot gets every-bot ones and its own, never disabled ones", () => {
        expect(ids({ kind: "tool", bot_id: 5 })).toEqual([1, 2]);
        expect(ids({ kind: "tool", bot_id: 6 })).toEqual([1]);
    });

    test("in a workspace, the workspace's too", () => {
        expect(ids({ kind: "tool", bot_id: 6, workspace_id: 9 })).toEqual([1, 3]);
        expect(ids({ kind: "tool", bot_id: 5, workspace_id: 9 })).toEqual([1, 2, 3]);
        expect(ids({ kind: "tool", bot_id: 5, workspace_id: 8 })).toEqual([1, 2]);
    });
});
