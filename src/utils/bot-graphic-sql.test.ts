import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import { runGraphicsSql, viewerGraphicsSql } from "./bot-graphic-sql";
import type { SqlCondition } from "./crew-access/types";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE bot_graphics (id INTEGER PRIMARY KEY, user_id INTEGER, bot_id INTEGER)`);
    db.run(`INSERT INTO bot_graphics VALUES (1, 7, 2), (2, 7, 3), (3, 9, 2)`);
});

function ids({ condition }: { condition: SqlCondition }) {
    return db
        .query(`SELECT g.id FROM bot_graphics g WHERE ${condition.sql} ORDER BY g.id`)
        .all(...condition.values)
        .map((row) => (row as { id: number }).id);
}

describe("viewerGraphicsSql", () => {
    test("a user sees only the graphics made for them", () => {
        expect(ids({ condition: viewerGraphicsSql({ user_id: 7 }) })).toEqual([1, 2]);
        expect(ids({ condition: viewerGraphicsSql({ user_id: 9 }) })).toEqual([3]);
        expect(ids({ condition: viewerGraphicsSql({ user_id: 1 }) })).toEqual([]);
    });
});

describe("runGraphicsSql", () => {
    test("a run edits only its bot's graphics for its user", () => {
        expect(ids({ condition: runGraphicsSql({ user_id: 7, bot_id: 2 }) })).toEqual([1]);
        expect(ids({ condition: runGraphicsSql({ user_id: 9, bot_id: 3 }) })).toEqual([]);
    });
});
