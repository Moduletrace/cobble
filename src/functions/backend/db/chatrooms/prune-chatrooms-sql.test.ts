import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import pruneChatroomsSql from "./prune-chatrooms-sql";

const DAY = 24 * 60 * 60 * 1000;
const now = 100 * DAY;

function seed() {
    const db = new Database(":memory:");

    db.run(`CREATE TABLE chatrooms (id INTEGER PRIMARY KEY, workspace_id INTEGER, parent_chatroom_id INTEGER,
        status TEXT, created_at INTEGER, last_activity_at INTEGER, closed_at INTEGER)`);

    const add = (id: number, workspace_id: number | null, status: string, days_ago: number, parent: number | null = null) =>
        db.run(`INSERT INTO chatrooms VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            id,
            workspace_id,
            parent,
            status,
            now - days_ago * DAY,
            now - days_ago * DAY,
            status == "open" ? null : now - days_ago * DAY,
        ]);

    return { db, add };
}

function pruned({ db, ...params }: { db: Database } & Parameters<typeof pruneChatroomsSql>[0]) {
    const { sql, values } = pruneChatroomsSql(params);

    return (db.query(sql).all(...values) as { id: number }[]).map((row) => row.id).sort((a, b) => a - b);
}

describe("pruneChatroomsSql", () => {
    test("closed rooms past the cutoff go; open ones never do", () => {
        const { db, add } = seed();

        add(1, null, "answered", 40);
        add(2, null, "open", 40);
        add(3, null, "failed", 5);

        expect(pruned({ db, cutoff: now - 30 * DAY, max_per_place: 100 })).toEqual([1]);
    });

    test("past the cap, the oldest closed rooms of that place go, counted per place", () => {
        const { db, add } = seed();

        add(1, null, "answered", 4);
        add(2, null, "open", 3);
        add(3, null, "answered", 2);
        add(4, null, "answered", 1);
        add(5, 9, "answered", 9);
        add(6, 9, "answered", 8);

        expect(pruned({ db, cutoff: 0, max_per_place: 2 })).toEqual([1]);
        expect(pruned({ db, cutoff: 0, max_per_place: 2, workspace_id: 9 })).toEqual([]);
        expect(pruned({ db, cutoff: 0, max_per_place: 1, workspace_id: 9 })).toEqual([5]);
    });

    test("a room an open room was asked from stays", () => {
        const { db, add } = seed();

        add(1, null, "answered", 40);
        add(2, null, "open", 1, 1);

        expect(pruned({ db, cutoff: now - 30 * DAY, max_per_place: 100 })).toEqual([]);
    });
});
