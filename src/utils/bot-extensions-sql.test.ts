import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import botExtensionsSql from "./bot-extensions-sql";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE custom_tools (id INTEGER PRIMARY KEY, all_bots INTEGER, enabled INTEGER)`);
    db.run(`CREATE TABLE bot_custom_tools (bot_id INTEGER, custom_tool_id INTEGER)`);
    db.run(`CREATE TABLE workspace_custom_tools (workspace_id INTEGER, custom_tool_id INTEGER)`);
    db.run(`CREATE TABLE skills (id INTEGER PRIMARY KEY, all_bots INTEGER, enabled INTEGER)`);
    db.run(`CREATE TABLE bot_skills (bot_id INTEGER, skill_id INTEGER)`);
    db.run(`CREATE TABLE workspace_skills (workspace_id INTEGER, skill_id INTEGER)`);
    /**
     * 1: every bot (given to 5 and 6). 2: bot 5. 3: workspace 9. 4: off,
     * given to 5. 5: nobody. 6: every bot, but 6 dropped it.
     */
    db.run(`INSERT INTO custom_tools VALUES (1, 1, 1), (2, 0, 1), (3, 0, 1), (4, 1, 0), (5, 0, 1), (6, 1, 1)`);
    db.run(`INSERT INTO bot_custom_tools VALUES (5, 1), (6, 1), (5, 2), (5, 4), (5, 6)`);
    db.run(`INSERT INTO workspace_custom_tools VALUES (9, 3)`);
    /**
     * The same shape, so skills reach a bot the same way.
     */
    db.run(`INSERT INTO skills VALUES (1, 1, 1), (2, 0, 1), (3, 0, 1), (4, 1, 0), (5, 0, 1), (6, 1, 1)`);
    db.run(`INSERT INTO bot_skills VALUES (5, 1), (6, 1), (5, 2), (5, 4), (5, 6)`);
    db.run(`INSERT INTO workspace_skills VALUES (9, 3)`);
});

function ids(params: Parameters<typeof botExtensionsSql>[0]) {
    const { sql, values } = botExtensionsSql(params);
    return db
        .query(sql)
        .all(...values)
        .map((row) => (row as { id: number }).id);
}

describe("botExtensionsSql", () => {
    test("a bot gets what it's given, never disabled ones, nor an every-bot one it dropped", () => {
        expect(ids({ kind: "tool", bot_id: 5 })).toEqual([1, 2, 6]);
        expect(ids({ kind: "tool", bot_id: 6 })).toEqual([1]);
        expect(ids({ kind: "tool", bot_id: 7 })).toEqual([]);
    });

    test("in a workspace, the workspace's too", () => {
        expect(ids({ kind: "tool", bot_id: 6, workspace_id: 9 })).toEqual([1, 3]);
        expect(ids({ kind: "tool", bot_id: 5, workspace_id: 9 })).toEqual([1, 2, 3, 6]);
        expect(ids({ kind: "tool", bot_id: 5, workspace_id: 8 })).toEqual([1, 2, 6]);
    });

    test("skills reach a bot the same way", () => {
        expect(ids({ kind: "skill", bot_id: 5 })).toEqual([1, 2, 6]);
        expect(ids({ kind: "skill", bot_id: 6 })).toEqual([1]);
        expect(ids({ kind: "skill", bot_id: 7 })).toEqual([]);
        expect(ids({ kind: "skill", bot_id: 6, workspace_id: 9 })).toEqual([1, 3]);
    });
});
