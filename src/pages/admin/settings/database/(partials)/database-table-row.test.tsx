import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { DatabaseTableSummary } from "@/src/types";
import DatabaseTableRow from "./database-table-row";

const table: DatabaseTableSummary = {
    name: "bot_file_vectors",
    type: "virtual",
    rows: 12,
    size_bytes: 2048,
    columns: [],
    key: { kind: "none" },
};

describe("DatabaseTableRow", () => {
    test("names the table, its record count and its size", () => {
        const html = renderToString(<DatabaseTableRow table={table} selected={false} onOpen={() => {}} />);

        expect(html).toContain("bot_file_vectors");
        expect(html).toContain("12");
        expect(html).toContain("2.0 KB");
    });

    test("links to the table's own address", () => {
        const html = renderToString(<DatabaseTableRow table={table} selected={false} onOpen={() => {}} />);

        expect(html).toContain(`href="/admin/settings/database?table=bot_file_vectors"`);
    });

    test("a table with no count yet shows a dash", () => {
        const html = renderToString(
            <DatabaseTableRow
                table={{ ...table, rows: null, size_bytes: null }}
                selected={false}
                onOpen={() => {}}
            />,
        );

        expect(html).toContain("-");
    });
});
