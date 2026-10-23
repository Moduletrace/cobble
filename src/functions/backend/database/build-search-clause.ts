import quoteSqlIdentifier from "./quote-sql-identifier";
import type { DatabaseSearchMode } from "@/src/types";

type Params = {
    /**
     * The table's columns, in their declared order.
     */
    columns: string[];
    search: string;
    mode: DatabaseSearchMode;
    /**
     * How many words at most are matched, so a long line can't build a
     * query of a hundred conditions.
     */
    max_words: number;
};

/**
 * Splits a search into its words, in the case they were typed (SQLite's
 * `lower` folds ASCII case).
 */
export function searchWords({ search, max_words }: { search: string; max_words: number }): string[] {
    return search
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, max_words);
}

type WordParams = {
    /**
     * The SQL that reads every column of a row as one text blob.
     */
    text: string;
    search: string;
    mode: DatabaseSearchMode;
    max_words: number;
};

/**
 * A search as a `WHERE` condition, with the parameters its placeholders
 * take, in order.
 */
export function searchCondition({ text, search, mode, max_words }: WordParams): { sql: string; values: string[] } {
    if (mode == "phrase") {
        return {
            sql: `instr(lower(${text}), lower(?)) > 0`,
            values: [search.trim()],
        };
    }

    const words = searchWords({ search, max_words });

    if (!words.length) {
        return { sql: `1`, values: [] };
    }

    return {
        sql: words.map(() => `instr(lower(${text}), lower(?)) > 0`).join(` AND `),
        values: words,
    };
}

/**
 * A search over every column of a table, as a condition the records query
 * puts in its `WHERE` (and the count query puts in its own), with the
 * parameters its placeholders take, in order.
 *
 * The columns are joined into one text blob per row, so a value is found
 * wherever it lives: an id, a name, a message's words. Reading every row
 * is the only honest way to find a value in a table with no index for it;
 * the page sizes keep what comes back small, not the cost of the search.
 */
export default function buildSearchClause({ columns, search, mode, max_words }: Params): {
    sql: string;
    values: string[];
} {
    const text = columns.length
        ? columns
              .map((name) => `COALESCE(CAST(${quoteSqlIdentifier({ name })} AS TEXT), '')`)
              .join(` || ' ' || `)
        : `''`;

    return searchCondition({ text, search, mode, max_words });
}
