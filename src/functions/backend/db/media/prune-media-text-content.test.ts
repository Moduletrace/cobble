import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { AppData } from "@/src/data/app-data";
import pruneMediaTextContent, { type SqlRunner } from "./prune-media-text-content";

type Row = { id: number; title: string; mime_type: string; media_type: string; text_content: string | null; updated_at?: number };

function makeDb({ rows }: { rows: Row[] }) {
    const db = new Database(":memory:");

    db.run(
        `CREATE TABLE media (
            id INTEGER PRIMARY KEY,
            title TEXT,
            mime_type TEXT,
            media_type TEXT,
            text_content TEXT,
            updated_at INTEGER
        )`,
    );

    const insert = db.prepare(
        `INSERT INTO media (id, title, mime_type, media_type, text_content) VALUES (?, ?, ?, ?, ?)`,
    );

    for (const row of rows) insert.run(row.id, row.title, row.mime_type, row.media_type, row.text_content);

    const run: SqlRunner = async ({ sql, values }) => {
        const statement = db.prepare(sql);

        if (sql.trim().toUpperCase().startsWith("SELECT")) {
            return { payload: statement.all(...((values || []) as never[])) as unknown[] };
        }

        statement.run(...((values || []) as never[]));

        return { payload: [] };
    };

    const read = (id: number) =>
        (db.query(`SELECT text_content FROM media WHERE id = ?`).get(id) as { text_content: string | null }).text_content;

    return { db, run, read };
}

describe("pruneMediaTextContent", () => {
    test("clears raw bytes from a type the extractor can't read, and keeps a document's text", async () => {
        const { run, read } = makeDb({
            rows: [
                { id: 1, title: "logo.svg", mime_type: "image/svg+xml", media_type: "document", text_content: "<svg><path d='M0 0'/></svg>" },
                { id: 2, title: "bundle.zip", mime_type: "application/zip", media_type: "document", text_content: "PK\u0003\u0004binary" },
                { id: 3, title: "invoice.pdf", mime_type: "application/pdf", media_type: "document", text_content: "Total: 12" },
            ],
        });

        const result = await pruneMediaTextContent({ run });

        expect(result.checked).toBe(3);
        expect(result.cleared).toBe(2);
        expect(result.truncated).toBe(0);
        expect(read(1)).toBeNull();
        expect(read(2)).toBeNull();
        expect(read(3)).toBe("Total: 12");
    });

    test("cuts an oversized document to the store ceiling", async () => {
        const text = "a".repeat(AppData.BotAttachmentTextStoreMaxChars + 1000);
        const { run, read } = makeDb({
            rows: [{ id: 4, title: "huge.txt", mime_type: "text/plain", media_type: "document", text_content: text }],
        });

        const result = await pruneMediaTextContent({ run });
        const after = read(4)!;

        expect(result.truncated).toBe(1);
        expect(result.cleared).toBe(0);
        expect(after.length).toBeLessThanOrEqual(AppData.BotAttachmentTextStoreMaxChars);
        expect(after).toContain("Truncated");
        expect(result.reclaimed_bytes).toBeGreaterThan(0);
    });

    test("is safe to rerun: a second sweep changes nothing", async () => {
        const { run, read } = makeDb({
            rows: [{ id: 5, title: "icon.svg", mime_type: "image/svg+xml", media_type: "document", text_content: "raw" }],
        });

        await pruneMediaTextContent({ run });
        const second = await pruneMediaTextContent({ run });

        expect(second.checked).toBe(0);
        expect(second.changes).toEqual([]);
        expect(second.reclaimed_bytes).toBe(0);
        expect(read(5)).toBeNull();
    });

    test("stamps updated_at on the rows it rewrites", async () => {
        const now = 1_700_000_000_000;
        const { run, db } = makeDb({
            rows: [{ id: 6, title: "x.zip", mime_type: "application/zip", media_type: "document", text_content: "raw" }],
        });

        await pruneMediaTextContent({ run, now });

        expect(
            (db.query(`SELECT updated_at FROM media WHERE id = 6`).get() as { updated_at: number }).updated_at,
        ).toBe(now);
    });

    test("reports every change with its row, name and sizes", async () => {
        const { run } = makeDb({
            rows: [{ id: 7, title: "sheet.xlsx", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", media_type: "document", text_content: "PK\u0003\u0004" }],
        });

        const result = await pruneMediaTextContent({ run });

        expect(result.changes).toEqual([
            { media_id: 7, name: "sheet.xlsx", before_chars: 4, after_chars: 0, text_content: null },
        ]);
    });
});
