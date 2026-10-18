import BunSQLite from "@moduletrace/bun-sqlite";

type DocumentNumberTarget = {
    table: "invoices" | "quotes";
    column: "invoice_number" | "quote_number";
};

export type DocumentNumberSqlRunner = (args: {
    sql: string;
    values: (string | number)[];
}) => Promise<{ singleRes?: { max_seq?: number | string | null } | null }>;

type Params = DocumentNumberTarget & {
    prefix: string;
    /**
     * Injectable query runner, used by tests to target an in-memory DB.
     */
    run_sql?: DocumentNumberSqlRunner;
};

/**
 * # Grab the next document sequence.
 * Reads the highest existing numeric suffix for the prefix instead of
 * counting rows, so deleting a document can never hand out a number that
 * already exists.
 */
export default async function grabNextDocumentSequence({
    table,
    column,
    prefix,
    run_sql,
}: Params): Promise<number> {
    const sql = `SELECT MAX(CAST(SUBSTR(${column}, ?) AS INTEGER)) AS max_seq FROM ${table} WHERE ${column} LIKE ?`;
    const values = [prefix.length + 2, `${prefix}-%`];

    const res = run_sql
        ? await run_sql({ sql, values })
        : await BunSQLite.sql({ sql, values });

    return Number(res.singleRes?.max_seq || 0) + 1;
}
