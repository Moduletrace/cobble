import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import grabNextDocumentSequence, {
    type DocumentNumberSqlRunner,
} from "./grab-next-document-sequence";

let db: Database;
let run_sql: DocumentNumberSqlRunner;

beforeEach(() => {
    db = new Database(":memory:");
    db.run("CREATE TABLE invoices (invoice_number TEXT UNIQUE)");

    run_sql = async ({ sql, values }) => {
        const row = db.query(sql).get(...values) as
            | { max_seq: number | null }
            | null;

        return { singleRes: row };
    };
});

function insertNumbers(numbers: string[]) {
    const insert = db.prepare("INSERT INTO invoices (invoice_number) VALUES (?)");

    for (const number of numbers) {
        insert.run(number);
    }
}

describe("grabNextDocumentSequence", () => {
    test("starts at 1 for an empty table", async () => {
        const next = await grabNextDocumentSequence({
            table: "invoices",
            column: "invoice_number",
            prefix: "BSQLITE-202610",
            run_sql,
        });

        expect(next).toBe(1);
    });

    test("returns max + 1 for existing numbers", async () => {
        insertNumbers([
            "BSQLITE-202610-001",
            "BSQLITE-202610-002",
            "BSQLITE-202610-003",
        ]);

        const next = await grabNextDocumentSequence({
            table: "invoices",
            column: "invoice_number",
            prefix: "BSQLITE-202610",
            run_sql,
        });

        expect(next).toBe(4);
    });

    test("does not reuse a number after a deletion", async () => {
        insertNumbers(["BSQLITE-202610-001", "BSQLITE-202610-003"]);

        const next = await grabNextDocumentSequence({
            table: "invoices",
            column: "invoice_number",
            prefix: "BSQLITE-202610",
            run_sql,
        });

        expect(next).toBe(4);
    });

    test("ignores numbers from other prefixes", async () => {
        insertNumbers([
            "BSQLITE-202609-099",
            "BSQLITEQ-202610-050",
            "BSQLITE-202610-002",
        ]);

        const next = await grabNextDocumentSequence({
            table: "invoices",
            column: "invoice_number",
            prefix: "BSQLITE-202610",
            run_sql,
        });

        expect(next).toBe(3);
    });

    test("handles sequences beyond three digits", async () => {
        insertNumbers(["BSQLITE-202610-009", "BSQLITE-202610-010"]);

        const next = await grabNextDocumentSequence({
            table: "invoices",
            column: "invoice_number",
            prefix: "BSQLITE-202610",
            run_sql,
        });

        expect(next).toBe(11);
    });
});
