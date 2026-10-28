import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import dropStoredFileTextSql from "./drop-stored-file-text-sql";

function scratch() {
    const db = new Database(":memory:");

    db.run(`CREATE TABLE media (id INTEGER PRIMARY KEY, text_content TEXT)`);
    db.run(`CREATE TABLE knowledgebase_documents (id INTEGER PRIMARY KEY, media_id INTEGER)`);
    db.run(`CREATE TABLE file_ingest_queue (id INTEGER PRIMARY KEY, document_id INTEGER)`);
    db.run(`CREATE TABLE bot_file_chunks (id INTEGER PRIMARY KEY, text TEXT)`);

    db.run(`INSERT INTO media (id, text_content) VALUES (1, 'an attachment'), (2, 'a knowledgebase upload'), (3, NULL)`);
    db.run(`INSERT INTO knowledgebase_documents (id, media_id) VALUES (1, 2), (2, NULL)`);
    db.run(`INSERT INTO file_ingest_queue (id, document_id) VALUES (1, NULL), (2, 1)`);
    db.run(`INSERT INTO bot_file_chunks (id, text) VALUES (1, 'old passage')`);

    return db;
}

function run(db: Database) {
    for (const sql of dropStoredFileTextSql()) db.run(sql);
}

describe("dropStoredFileTextSql", () => {
    test("drops the bot file index", () => {
        const db = scratch();

        run(db);

        const tables = db.query(`SELECT name FROM sqlite_master WHERE name LIKE 'bot_file_%'`).all();

        expect(tables).toEqual([]);
    });

    test("clears upload text but keeps a knowledgebase document's", () => {
        const db = scratch();

        run(db);

        const rows = db.query(`SELECT id, text_content FROM media ORDER BY id`).all();

        expect(rows).toEqual([
            { id: 1, text_content: null },
            { id: 2, text_content: "a knowledgebase upload" },
            { id: 3, text_content: null },
        ]);
    });

    test("keeps only document jobs on the ingest queue", () => {
        const db = scratch();

        run(db);

        expect(db.query(`SELECT id FROM file_ingest_queue`).all()).toEqual([{ id: 2 }]);
    });

    test("runs again on a clean database without failing", () => {
        const db = scratch();

        run(db);

        expect(() => run(db)).not.toThrow();
    });
});
