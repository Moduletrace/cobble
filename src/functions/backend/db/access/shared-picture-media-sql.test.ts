import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import sharedPictureMediaSql from "./shared-picture-media-sql";

const db = new Database(":memory:");

beforeAll(() => {
    db.run(`CREATE TABLE media (id INTEGER PRIMARY KEY, user_id INTEGER, is_primary INTEGER, archived INTEGER)`);
    db.run(`CREATE TABLE media_paradigms (media_id INTEGER, media_paradigm TEXT)`);
    db.run(`CREATE TABLE bots (id INTEGER PRIMARY KEY, image_media_id INTEGER)`);
    db.run(`CREATE TABLE workspaces (id INTEGER PRIMARY KEY, image_media_id INTEGER)`);

    db.run(`INSERT INTO media VALUES
        (1, 7, 1, 0),
        (2, 8, 1, 0),
        (3, 8, NULL, 0),
        (4, 9, NULL, 0),
        (5, 7, NULL, 0),
        (6, 7, NULL, 0),
        (7, 7, NULL, 0),
        (8, 7, NULL, 0),
        (10, 7, NULL, 0),
        (11, 7, NULL, 0)`);

    // 1: user 7's current photo, 2: user 8's, 3: an old photo of user 8's (no longer primary)
    db.run(`INSERT INTO media_paradigms VALUES
        (1, 'user-profile-image'),
        (2, 'user-profile-image'),
        (3, 'user-profile-image'),
        (4, 'bot-image'),
        (5, 'bot-image'),
        (6, 'workspace-image'),
        (7, 'workspace-image'),
        (8, 'bot-file'),
        (10, 'bot-attachment')`);

    // 4: still bot 2's picture, 5: a bot picture no bot points at any more
    db.run(`INSERT INTO bots VALUES (2, 4), (3, NULL)`);
    // 6: still workspace 10's picture, 7: a workspace picture nothing points at
    // 10: an older picture set straight from a chat upload, still workspace 12's
    db.run(`INSERT INTO workspaces VALUES (10, 6), (11, NULL), (12, 10)`);
});

function visible({ archived }: { archived?: number } = {}) {
    const condition = sharedPictureMediaSql();

    return db
        .query(
            `SELECT m.id FROM media m WHERE ${condition.sql} ${
                archived === undefined ? `` : `AND COALESCE(m.archived, 0) <> 1`
            } ORDER BY m.id`,
        )
        .all(...condition.values)
        .map((row) => (row as { id: number }).id);
}

describe("sharedPictureMediaSql", () => {
    test("every user's current photo, and every bot's and workspace's picture", () => {
        expect(visible()).toEqual([1, 2, 4, 6, 10]);
    });

    test("archived media is not a picture anyone gets", () => {
        db.run(`UPDATE media SET archived = 1 WHERE id = 2`);
        expect(visible({ archived: 0 })).toEqual([1, 4, 6, 10]);
        db.run(`UPDATE media SET archived = 0 WHERE id = 2`);
    });

    test("a photo that is no longer the user's primary is not shared", () => {
        expect(visible()).not.toContain(3);
    });

    test("a picture no bot or workspace points at any more is not shared", () => {
        expect(visible()).not.toContain(5);
        expect(visible()).not.toContain(7);
    });

    test("anything else stays private, a bot's file among them", () => {
        expect(visible()).not.toContain(8);
        expect(visible()).not.toContain(11);
    });

    test("a picture a workspace points at is shared whatever its paradigm", () => {
        expect(visible()).toContain(10);
    });

    test("removing a picture row closes it at once", () => {
        db.run(`INSERT INTO media VALUES (9, 7, NULL, 0)`);
        db.run(`INSERT INTO media_paradigms VALUES (9, 'bot-image')`);
        db.run(`UPDATE bots SET image_media_id = 9 WHERE id = 3`);

        expect(visible()).toContain(9);

        db.run(`UPDATE bots SET image_media_id = NULL WHERE id = 3`);

        expect(visible()).not.toContain(9);
    });
});
