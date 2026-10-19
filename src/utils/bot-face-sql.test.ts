import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import botFaceSql from "./bot-face-sql";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE bots (id INTEGER PRIMARY KEY)`);
    db.run(`CREATE TABLE bot_user_faces (bot_id INTEGER, user_id INTEGER, face TEXT, status_line TEXT)`);
    db.run(`INSERT INTO bots VALUES (1), (2)`);
    db.run(`INSERT INTO bot_user_faces VALUES (1, 7, 'needs-you', 'Waiting on you'), (2, 8, 'working', 'Working on a task')`);
});

function faces({ user_id, prefix }: { user_id: number; prefix?: string }) {
    const columns = botFaceSql({ user_id, prefix });

    return db.query(`SELECT b.id, ${columns.sql} FROM bots b ORDER BY b.id`).all(...columns.values);
}

describe("botFaceSql", () => {
    test("each user sees only their own face of a bot", () => {
        expect(faces({ user_id: 7 })).toEqual([
            { id: 1, face: "needs-you", status_line: "Waiting on you" },
            { id: 2, face: "idle", status_line: "" },
        ]);
        expect(faces({ user_id: 8 })).toEqual([
            { id: 1, face: "idle", status_line: "" },
            { id: 2, face: "working", status_line: "Working on a task" },
        ]);
    });

    test("a user with no faces sees every bot idle, under the prefix", () => {
        expect(faces({ user_id: 9, prefix: "bot_" })).toEqual([
            { id: 1, bot_face: "idle", bot_status_line: "" },
            { id: 2, bot_face: "idle", bot_status_line: "" },
        ]);
    });
});
