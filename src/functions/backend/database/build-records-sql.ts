import buildSearchClause from "./build-search-clause";
import quoteSqlIdentifier from "./quote-sql-identifier";
import type { DatabaseSearchMode, DatabaseTableKey } from "@/src/types";

/**
 * The column every record's key comes back in.
 */
export const RecordKeyAlias = "__cobble_key";

type MetaKind = "type" | "length";

/**
 * The column SQLite's own type of a value comes back in, beside the value.
 */
export function metaColumnAlias({ name, kind }: { name: string; kind: MetaKind }): string {
    return `__cobble_${kind}__${name}`;
}

type ColumnListParams = {
    /**
     * The table's columns, in their declared order.
     */
    columns: string[];
    /**
     * The most characters of a value the query takes out of SQLite.
     */
    max_chars: number;
};

/**
 * What a query selects: every column, cut to `max_chars` so no huge value
 * (a record's long text, a job's checkpoint) crosses out of SQLite, and
 * beside each one its stored type and length, the two things that say how
 * to read it and whether it was cut.
 */
export function buildRecordColumns({ columns, max_chars }: ColumnListParams): string[] {
    const selected: string[] = [];

    for (const name of columns) {
        const column = quoteSqlIdentifier({ name });

        selected.push(`substr(${column}, 1, ${max_chars}) AS ${column}`);
        selected.push(
            `typeof(${column}) AS ${quoteSqlIdentifier({ name: metaColumnAlias({ name, kind: "type" }) })}`,
        );
        selected.push(
            `length(${column}) AS ${quoteSqlIdentifier({ name: metaColumnAlias({ name, kind: "length" }) })}`,
        );
    }

    return selected;
}

/**
 * The key column, which is what identifies a record: a primary key, the
 * rowid, or nothing at all for a virtual table that has neither.
 */
export function buildKeyColumn({ key }: { key: DatabaseTableKey }): string[] {
    if (key.kind == "column" && key.name) {
        return [`${quoteSqlIdentifier({ name: key.name })} AS "${RecordKeyAlias}"`];
    }

    if (key.kind == "rowid") {
        /**
         * Quoted: `rowid` is read as the ref's rowid that way, and as a
         * column of the table's own named `rowid` otherwise.
         */
        return [`"rowid" AS "${RecordKeyAlias}"`];
    }

    return [];
}

type SelectParams = ColumnListParams & {
    table: string;
    key: DatabaseTableKey;
    /**
     * What to look for, when the browser is narrowing the table down.
     */
    search?: DatabaseSearch | null;
};

/**
 * A search a records query narrows its table by.
 */
export type DatabaseSearch = {
    text: string;
    mode: DatabaseSearchMode;
    /**
     * How many words at most are matched, so a long line can't build a
     * query of a hundred conditions.
     */
    max_words: number;
};

type Query = { sql: string; values: string[] };

/**
 * The `SELECT` a page of records and one record both start from: the key,
 * every column with its meta columns, and, when something is searched, a
 * `WHERE` over all of the table's text.
 */
export function buildRecordSelect({ table, columns, key, max_chars, search }: SelectParams): Query {
    const selected = [...buildKeyColumn({ key }), ...buildRecordColumns({ columns, max_chars })];
    const from = `SELECT ${selected.join(", ")} FROM ${quoteSqlIdentifier({ name: table })}`;

    if (!search) return { sql: from, values: [] };

    const where = buildSearchClause({
        columns,
        search: search.text,
        mode: search.mode,
        max_words: search.max_words,
    });

    return { sql: `${from} WHERE ${where.sql}`, values: where.values };
}

type PageParams = SelectParams & {
    limit: number;
    offset: number;
};

/**
 * One page of a table's records, newest key first, so a freshly written
 * record shows at the top. A table with no key to order by comes back in
 * whatever order SQLite reads it.
 */
export default function buildRecordsSql({ limit, offset, ...params }: PageParams): Query {
    const select = buildRecordSelect(params);
    const order = params.key.kind == "none" ? "" : ` ORDER BY "${RecordKeyAlias}" DESC`;

    return {
        sql: `${select.sql}${order} LIMIT ${limit} OFFSET ${offset}`,
        values: select.values,
    };
}

type RecordParams = SelectParams & {
    /**
     * The record's key, as it came in the query string.
     */
    value: string | number;
};

/**
 * One record, by its key. Only asked for a table that has one, so a row
 * always comes back.
 */
export function buildRecordSql({ value, ...params }: RecordParams): { sql: string; values: (string | number)[] } {
    const select = buildRecordSelect(params);

    return {
        sql: `${select.sql} WHERE "${RecordKeyAlias}" = ? LIMIT 1`,
        values: [...select.values, value],
    };
}

type CountParams = Omit<SelectParams, "key" | "max_chars">;

/**
 * How many records the table holds, or how many the search matched, for
 * the pager under it.
 */
export function buildCountSql({ table, columns, search }: CountParams): Query {
    const from = `SELECT COUNT(*) AS total FROM ${quoteSqlIdentifier({ name: table })}`;

    if (!search) return { sql: from, values: [] };

    const where = buildSearchClause({
        columns,
        search: search.text,
        mode: search.mode,
        max_words: search.max_words,
    });

    return { sql: `${from} WHERE ${where.sql}`, values: where.values };
}

/**
 * The record SQL's parameter (a primary key or a rowid), read from a
 * query string: digits are a number, so an integer key compares as one,
 * and anything else stays a string.
 */
export function parseRecordKey({ value }: { value: string }): string | number {
    const text = value.trim();

    return /^-?\d+$/.test(text) && Number.isSafeInteger(Number(text)) ? Number(text) : text;
}
