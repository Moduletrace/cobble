import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { DatabaseRecordsPayload, DatabaseTableSummary } from "@/src/types";
import DatabaseRecordsTable from "./database-records-table";

const table: DatabaseTableSummary = {
    name: "bot_messages",
    type: "table",
    rows: 295,
    size_bytes: 123456,
    columns: [
        { name: "id", type: "INTEGER", pk: true },
        { name: "text", type: "TEXT", pk: false },
        { name: "meta", type: "TEXT", pk: false },
    ],
    key: { kind: "column", name: "id" },
};

const records: DatabaseRecordsPayload = {
    table,
    records: [
        {
            key: 295,
            cells: {
                id: { text: "295", kind: "number", truncated: false },
                text: {
                    text: "line one\nline two\nline three\nline four",
                    kind: "text",
                    truncated: true,
                },
                meta: { text: "", kind: "null", truncated: false },
            },
        },
    ],
    total: 1,
    page: 1,
    page_size: 50,
    search: "",
    mode: "every_word",
};

describe("DatabaseRecordsTable", () => {
    test("draws every column of the table", () => {
        const html = renderToString(<DatabaseRecordsTable records={records} onOpenRecord={() => {}} />);

        expect(html).toContain(">id<");
        expect(html).toContain(">text<");
        expect(html).toContain(">meta<");
        expect(html).toContain("295");
    });

    test("cuts a long value to three lines rather than letting it run", () => {
        const html = renderToString(<DatabaseRecordsTable records={records} onOpenRecord={() => {}} />);

        expect(html).toContain("line-clamp-3");
        expect(html).toContain("line one");
    });

    test("says NULL instead of leaving a cell blank", () => {
        const html = renderToString(<DatabaseRecordsTable records={records} onOpenRecord={() => {}} />);

        expect(html).toContain("NULL");
    });

    test("a table with no key still reads, without a way into a record", () => {
        const html = renderToString(
            <DatabaseRecordsTable
                records={{
                    ...records,
                    table: { ...table, key: { kind: "none" } },
                    records: [{ key: null, cells: records.records[0]?.cells || {} }],
                }}
                onOpenRecord={() => {}}
            />,
        );

        expect(html).toContain("line one");
    });
});
