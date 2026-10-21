import { afterAll, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import fitVectorDimensions from "@/src/harness/embeddings/fit-vector-dimensions";

/**
 * The exact insert and nearest-neighbour shape `ingestBotFile` and
 * `searchBotFiles` use, on a scratch database: vec0's metadata columns are
 * NOT NULL, and a side-car filter can't share the match query.
 */
function createDb() {
    const db = new Database(":memory:");
    sqliteVec.load(db);
    db.run(`CREATE VIRTUAL TABLE bot_file_vectors USING vec0(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER,
        updated_at INTEGER,
        embedding float[8],
        +chunk_id INTEGER,
        +file_id INTEGER,
        +scope TEXT,
        +owner_id INTEGER
    )`);

    return db;
}

const vector = (values: number[]) => fitVectorDimensions({ vector: values, dimensions: 8 });

const insert = (db: Database, row: { chunk_id: number; file_id: number; scope: string; owner_id: number; v: number[] }) => {
    const now = Date.now();

    db.run(
        `INSERT INTO bot_file_vectors (created_at, updated_at, embedding, chunk_id, file_id, scope, owner_id) VALUES (?, ?, vec_f32(?), ?, ?, ?, ?)`,
        [now, now, vector(row.v), row.chunk_id, row.file_id, row.scope, row.owner_id],
    );
};

describe("bot file vectors", () => {
    test("stores a vector and matches the nearest one", () => {
        const db = createDb();

        insert(db, { chunk_id: 1, file_id: 10, scope: "bot", owner_id: 1, v: [1, 0, 0, 0] });
        insert(db, { chunk_id: 2, file_id: 11, scope: "bot", owner_id: 1, v: [0, 1, 0, 0] });

        const rows = db
            .query(
                `SELECT chunk_id, file_id, distance FROM bot_file_vectors WHERE embedding MATCH vec_f32(?1) AND k = 2 ORDER BY distance`,
            )
            .all(vector([0.9, 0.1, 0, 0])) as { chunk_id: number; distance: number }[];

        expect(rows.length).toBe(2);
        expect(rows[0]!.chunk_id).toBe(1);
        expect(rows[0]!.distance).toBeLessThan(rows[1]!.distance);
    });

    test("filters scopes in the app, not in the match query", () => {
        const db = createDb();

        insert(db, { chunk_id: 1, file_id: 10, scope: "bot", owner_id: 1, v: [1, 0] });
        insert(db, { chunk_id: 2, file_id: 20, scope: "bot", owner_id: 2, v: [1, 0.05] });
        insert(db, { chunk_id: 3, file_id: 30, scope: "workspace", owner_id: 3, v: [1, 0.1] });

        const nearest = db
            .query(`SELECT chunk_id, scope, owner_id, distance FROM bot_file_vectors WHERE embedding MATCH vec_f32(?1) AND k = 10 ORDER BY distance`)
            .all(vector([1, 0])) as { chunk_id: number; scope: string; owner_id: number }[];

        expect(nearest.length).toBe(3);

        const mine = nearest.filter((row) => row.scope == "bot" && row.owner_id == 1);

        expect(mine.map((row) => row.chunk_id)).toEqual([1]);
    });

    test("a side-car filter in the match query is refused", () => {
        const db = createDb();

        insert(db, { chunk_id: 1, file_id: 10, scope: "bot", owner_id: 1, v: [1, 0] });

        expect(() =>
            db
                .query(
                    `SELECT chunk_id FROM bot_file_vectors WHERE embedding MATCH vec_f32(?1) AND k = 2 AND scope = 'bot'`,
                )
                .all(vector([1, 0])),
        ).toThrow(/illegal WHERE constraint/);
    });

    test("an insert without vec0's metadata columns is refused", () => {
        const db = createDb();

        expect(() =>
            db.run(
                `INSERT INTO bot_file_vectors (embedding, chunk_id, file_id, scope, owner_id) VALUES (vec_f32(?1), 1, 10, 'bot', 1)`,
                [vector([1, 0])],
            ),
        ).toThrow();
    });

    test("deletes a file's vectors by its side-car column", () => {
        const db = createDb();

        insert(db, { chunk_id: 1, file_id: 10, scope: "bot", owner_id: 1, v: [1, 0] });

        db.run(`DELETE FROM bot_file_vectors WHERE file_id = ?`, [10]);

        const count = db.query(`SELECT COUNT(*) AS n FROM bot_file_vectors`).get() as { n: number };

        expect(count.n).toBe(0);
    });
});

describe("fitVectorDimensions", () => {
    test("pads a short vector and normalizes it", () => {
        const out = fitVectorDimensions({ vector: [3, 4], dimensions: 4 });
        const norm = Math.sqrt([...out].reduce((sum, value) => sum + value * value, 0));

        expect(out.length).toBe(4);
        expect(Math.round(norm * 1000) / 1000).toBe(1);
        expect(Math.round(out[0]! * 1000) / 1000).toBe(0.6);
    });

    test("cuts a long vector", () => {
        expect(fitVectorDimensions({ vector: [1, 1, 1, 1, 1, 1], dimensions: 2 }).length).toBe(2);
    });

    test("leaves a zero vector as zeros", () => {
        expect([...fitVectorDimensions({ vector: [0, 0], dimensions: 2 })]).toEqual([0, 0]);
    });
});

afterAll(() => {});
