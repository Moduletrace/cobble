import { Database } from "bun:sqlite";
import { beforeAll, describe, expect, test } from "bun:test";
import buildRecordsSql, {
    buildCountSql,
    buildRecordSql,
    buildRecordSelect,
    metaColumnAlias,
    parseRecordKey,
    RecordKeyAlias,
} from "./build-records-sql";
import buildSearchClause, { searchWords } from "./build-search-clause";
import buildRecordRow from "./build-record-row";
import buildTableCatalogSql from "./build-table-catalog-sql";
import groupTableCatalog from "./group-table-catalog";
import resolveTableKey from "./resolve-table-key";
import quoteSqlIdentifier from "./quote-sql-identifier";
import type { TableCatalogRow } from "./table-catalog-types";
import type { DatabaseTableColumn } from "@/src/types";

const db = new Database(":memory:");

const messages_columns: DatabaseTableColumn[] = [
    { name: "id", type: "INTEGER", pk: true },
    { name: "role", type: "TEXT", pk: false },
    { name: "text", type: "TEXT", pk: false },
];

beforeAll(() => {
    db.run(`CREATE TABLE "messages" ("id" INTEGER PRIMARY KEY, "role" TEXT, "text" TEXT)`);
    db.run(`INSERT INTO "messages" VALUES
        (1, 'user', 'hello there'),
        (2, 'bot', 'Hello there, how can I help?'),
        (3, 'user', 'a "quoted" table name and a long body'),
        (4, 'bot', NULL)`);
    db.run(`CREATE TABLE "no_key" ("a" TEXT, "b" TEXT)`);
    db.run(`INSERT INTO "no_key" VALUES ('one', 'two')`);
});

function rows({ sql, values, max_chars = 400 }: { sql: string; values: string[]; max_chars?: number }) {
    return db
        .query(sql)
        .all(...values)
        .map((row) =>
            buildRecordRow({ row: row as Record<string, unknown>, columns: messages_columns, max_chars }),
        );
}

describe("quoteSqlIdentifier", () => {
    test("wraps a plain name", () => {
        expect(quoteSqlIdentifier({ name: "bots" })).toBe(`"bots"`);
    });

    test("doubles a quote instead of letting it out", () => {
        expect(quoteSqlIdentifier({ name: `a"b` })).toBe(`"a""b"`);
    });
});

describe("resolveTableKey", () => {
    test("a single primary key column names the records", () => {
        expect(resolveTableKey({ columns: messages_columns, has_rowid: true })).toEqual({ kind: "column", name: "id" });
    });

    test("no primary key falls back to the rowid", () => {
        expect(resolveTableKey({ columns: [{ name: "a", type: "TEXT", pk: false }], has_rowid: true })).toEqual({
            kind: "rowid",
        });
    });

    test("a virtual table with neither has no key", () => {
        expect(resolveTableKey({ columns: [{ name: "a", type: "TEXT", pk: false }], has_rowid: false })).toEqual({
            kind: "none",
        });
    });

    test("a composite primary key falls back to the rowid", () => {
        expect(
            resolveTableKey({
                columns: [
                    { name: "a", type: "TEXT", pk: true },
                    { name: "b", type: "TEXT", pk: true },
                ],
                has_rowid: true,
            }),
        ).toEqual({ kind: "rowid" });
    });
});

describe("buildRecordsSql", () => {
    test("returns a page of records newest key first", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns: messages_columns.map((column) => column.name),
            key: { kind: "column", name: "id" },
            max_chars: 400,
            limit: 2,
            offset: 0,
            search: null,
        });
        const records = rows(query);

        expect(records.map((record) => record.key)).toEqual([4, 3]);
        expect(records[0]?.cells["text"]?.kind).toBe("null");
        expect(records[1]?.cells["role"]?.text).toBe("user");
    });

    test("pages with the offset it is given", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns: messages_columns.map((column) => column.name),
            key: { kind: "column", name: "id" },
            max_chars: 400,
            limit: 2,
            offset: 2,
            search: null,
        });

        expect(rows(query).map((record) => record.key)).toEqual([2, 1]);
    });

    test("cuts a long value and says so", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns: messages_columns.map((column) => column.name),
            key: { kind: "column", name: "id" },
            max_chars: 4,
            limit: 1,
            offset: 1,
            search: null,
        });
        const [record] = rows({ ...query, max_chars: 4 });

        expect(record?.cells["text"]?.text).toBe(`a "q`); // four characters, cut
        expect(record?.cells["text"]?.truncated).toBe(true);
    });

    test("orders by the rowid when the table has no primary key", () => {
        const query = buildRecordsSql({
            table: "no_key",
            columns: ["a", "b"],
            key: { kind: "rowid" },
            max_chars: 400,
            limit: 10,
            offset: 0,
            search: null,
        });
        const record = db.query(query.sql).get(...query.values) as Record<string, unknown>;

        expect(Number(record[RecordKeyAlias])).toBe(1);
    });

    test("a table with no key comes back without one", () => {
        const query = buildRecordsSql({
            table: "no_key",
            columns: ["a", "b"],
            key: { kind: "none" },
            max_chars: 400,
            limit: 10,
            offset: 0,
            search: null,
        });
        const record = db.query(query.sql).get(...query.values) as Record<string, unknown>;

        expect(query.sql).not.toContain(`ORDER BY`);
        expect(record[RecordKeyAlias]).toBeUndefined();
    });

    test("selects a meta column per column, so a cut value can be known", () => {
        const select = buildRecordSelect({
            table: "messages",
            columns: messages_columns.map((column) => column.name),
            key: { kind: "column", name: "id" },
            max_chars: 400,
        });

        expect(select.sql).toContain(quoteSqlIdentifier({ name: metaColumnAlias({ name: "text", kind: "length" }) }));
        expect(select.sql).toContain(quoteSqlIdentifier({ name: metaColumnAlias({ name: "text", kind: "type" }) }));
    });
});

describe("search", () => {
    const columns = messages_columns.map((column) => column.name);
    const every_word = { text: "hello there", mode: "every_word" as const, max_words: 8 };

    test("every word matches anywhere in the record, in any order", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns,
            key: { kind: "column", name: "id" },
            max_chars: 400,
            limit: 10,
            offset: 0,
            search: every_word,
        });

        expect(rows(query).map((record) => record.key).sort()).toEqual([1, 2]);
    });

    test("a phrase only matches where the words sit together", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns,
            key: { kind: "column", name: "id" },
            max_chars: 400,
            limit: 10,
            offset: 0,
            search: { text: "hello there", mode: "phrase", max_words: 8 },
        });

        expect(rows(query).map((record) => record.key).sort()).toEqual([1, 2]);
    });

    test("a phrase of one word that sits apart doesn't match", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns,
            key: { kind: "column", name: "id" },
            max_chars: 400,
            limit: 10,
            offset: 0,
            search: { text: "help hello", mode: "phrase", max_words: 8 },
        });

        expect(rows(query)).toEqual([]);
    });

    test("prefixes find a value, wherever it is in a word", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns,
            key: { kind: "column", name: "id" },
            max_chars: 400,
            limit: 10,
            offset: 0,
            search: { text: "quoted", mode: "every_word", max_words: 8 },
        });

        expect(rows(query).map((record) => record.key)).toEqual([3]);
    });

    test("matches an id as text", () => {
        const query = buildRecordsSql({
            table: "messages",
            columns,
            key: { kind: "column", name: "id" },
            max_chars: 400,
            limit: 10,
            offset: 0,
            search: { text: "3", mode: "every_word", max_words: 8 },
        });

        expect(rows(query).map((record) => record.key)).toEqual([3]);
    });

    test("counts only what matched", () => {
        const count = buildCountSql({ table: "messages", columns, search: every_word });
        const result = db.query(count.sql).get(...count.values) as { total: number };

        expect(result.total).toBe(2);
    });

    test("counts the whole table with no search", () => {
        const count = buildCountSql({ table: "messages", columns, search: null });
        const result = db.query(count.sql).get(...count.values) as { total: number };

        expect(result.total).toBe(4);
    });

    test("an empty search matches everything rather than failing", () => {
        const clause = buildSearchClause({ columns, search: "   ", mode: "every_word", max_words: 8 });

        expect(clause).toEqual({ sql: "1", values: [] });
    });

    test("keeps a search to its words", () => {
        expect(searchWords({ search: " a  b c ", max_words: 2 })).toEqual(["a", "b"]);
    });

    test("a table with no columns matches nothing", () => {
        const clause = buildSearchClause({ columns: [], search: "x", mode: "every_word", max_words: 8 });

        expect(clause.values).toEqual(["x"]);
        expect(clause.sql).toContain(`''`);
    });
});

describe("buildRecordSql", () => {
    test("reads one record by its key", () => {
        const query = buildRecordSql({
            table: "messages",
            columns: messages_columns.map((column) => column.name),
            key: { kind: "column", name: "id" },
            max_chars: 400,
            value: 2,
        });
        const [record] = rows({ sql: query.sql, values: query.values as string[] });

        expect(record?.key).toBe(2);
        expect(record?.cells["text"]?.text).toBe("Hello there, how can I help?");
    });

    test("finds nothing for a key that isn't there", () => {
        const query = buildRecordSql({
            table: "messages",
            columns: messages_columns.map((column) => column.name),
            key: { kind: "column", name: "id" },
            max_chars: 400,
            value: 99,
        });

        expect(db.query(query.sql).all(...(query.values as string[]))).toEqual([]);
    });
});

describe("parseRecordKey", () => {
    test("an integer key comes back as a number", () => {
        expect(parseRecordKey({ value: "42" })).toBe(42);
    });

    test("a text key stays text", () => {
        expect(parseRecordKey({ value: "abc" })).toBe("abc");
    });

    test("a number too big to be safe stays text", () => {
        expect(parseRecordKey({ value: "99999999999999999999" })).toBe("99999999999999999999");
    });
});

describe("buildTableCatalogSql", () => {
    test("reads every table and its columns, without SQLite's own tables", () => {
        const res = db.query(buildTableCatalogSql()).all() as TableCatalogRow[];
        const tables = groupTableCatalog({ rows: res });

        expect(tables.map((table) => table.name)).toEqual(["messages", "no_key"]);
        expect(tables[0]?.columns.map((column) => column.name)).toEqual(["id", "role", "text"]);
        expect(tables[0]?.has_rowid).toBe(true);
    });
});
