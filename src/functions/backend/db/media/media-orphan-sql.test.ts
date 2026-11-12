import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { mediaOrphanIdsSql, unlinkedAttachmentIdsSql } from "./media-orphan-sql";

/**
 * The two queries that decide a file is unreachable run against real
 * SQLite: a wrong condition here either deletes bytes a page still shows,
 * or leaves every orphan on disk forever.
 */
const db = new Database(":memory:");

db.run(`CREATE TABLE media (id INTEGER PRIMARY KEY, created_at INTEGER)`);
db.run(`CREATE TABLE media_paradigms (media_id INTEGER, media_paradigm TEXT)`);
db.run(`CREATE TABLE bot_message_media (media_id INTEGER)`);
db.run(`CREATE TABLE bot_files (media_id INTEGER)`);
db.run(`CREATE TABLE task_media (media_id INTEGER)`);
db.run(`CREATE TABLE knowledgebase_documents (media_id INTEGER)`);
db.run(`CREATE TABLE bots (image_media_id INTEGER)`);
db.run(`CREATE TABLE workspaces (image_media_id INTEGER)`);

const Old = 1_000;
const New = 10_000;

db.run(`INSERT INTO media VALUES
    (1, ${Old}),  -- an old upload whose message is gone
    (2, ${Old}),  -- an old upload its message still shows
    (3, ${Old}),  -- an old row nothing ever recorded
    (4, ${Old}),  -- a bot file's bytes, waiting for the link
    (5, ${New}),  -- a fresh upload, still on its way
    (6, ${Old}),  -- an old upload a bot file now holds
    (7, ${Old}),  -- an old picture a bot shows
    (8, ${Old})   -- an old row a task holds`);

db.run(`INSERT INTO media_paradigms VALUES
    (1, 'bot-attachment'),
    (2, 'bot-attachment'),
    (4, 'bot-file'),
    (5, 'bot-attachment'),
    (6, 'bot-attachment'),
    (7, 'bot-image'),
    (8, 'bot-attachment')`);

db.run(`INSERT INTO bot_message_media VALUES (2)`);
db.run(`INSERT INTO bot_files VALUES (6)`);
db.run(`INSERT INTO bots VALUES (7)`);
db.run(`INSERT INTO task_media VALUES (8)`);

function orphans({ cutoff, limit = 200 }: { cutoff: number; limit?: number }) {
    const { sql, values } = mediaOrphanIdsSql({ cutoff, limit });

    return (db.query(sql).all(...(values as number[])) as { id: number }[]).map((row) => row.id);
}

describe("mediaOrphanIdsSql", () => {
    test("takes an old upload no message shows and one nothing recorded", () => {
        expect(orphans({ cutoff: New })).toEqual([1, 3]);
    });

    test("leaves alone anything a table still points at", () => {
        const taken = orphans({ cutoff: New });

        expect(taken).not.toContain(2);
        expect(taken).not.toContain(6);
        expect(taken).not.toContain(7);
        expect(taken).not.toContain(8);
    });

    test("leaves a row with another paradigm to whatever made it", () => {
        expect(orphans({ cutoff: New })).not.toContain(4);
    });

    test("never takes a row newer than the cutoff", () => {
        expect(orphans({ cutoff: New })).not.toContain(5);
        expect(orphans({ cutoff: 0 })).toEqual([]);
    });

    test("stops at the batch size", () => {
        expect(orphans({ cutoff: New, limit: 1 })).toEqual([1]);
    });
});

describe("unlinkedAttachmentIdsSql", () => {
    function unlinked(media_ids: number[]) {
        const query = unlinkedAttachmentIdsSql({ media_ids });

        if (!query) return null;

        const { sql, values } = query;

        return (db.query(sql).all(...(values as number[])) as { id: number }[]).map((row) => row.id);
    }

    test("takes only the ids nothing points at", () => {
        expect(unlinked([1, 2, 6, 7, 8])).toEqual([1]);
    });

    test("repeats and bad ids change nothing", () => {
        expect(unlinked([1, 1, 0, -3, Number.NaN])).toEqual([1]);
    });

    test("an empty list asks nothing", () => {
        expect(unlinked([])).toBeNull();
        expect(unlinked([0, -1])).toBeNull();
    });
});