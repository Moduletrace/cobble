/**
 * The tables the database browser lists, each with its columns in their
 * declared order, in one statement: `pragma_table_list` finds the tables
 * and `pragma_table_info` reads each one's columns, the pragma taking the
 * table name as an argument the way a table-valued function does.
 *
 * Left out: SQLite's own `sqlite_*` tables, and the shadow tables a
 * virtual table keeps its internals in (the `bot_file_vectors_*` tables
 * behind the sqlite-vec index), which are storage, not rows anyone
 * browses.
 */
export default function buildTableCatalogSql(): string {
    return `SELECT
        l.name AS table_name,
        l.type AS table_type,
        l.wr AS without_rowid,
        p.cid AS column_index,
        p.name AS column_name,
        p.type AS column_type,
        p.pk AS column_pk
    FROM pragma_table_list AS l
    JOIN pragma_table_info(l.name) AS p
    WHERE l.schema = 'main'
        AND l.type IN ('table', 'virtual')
        AND l.name NOT LIKE 'sqlite\\_%' ESCAPE '\\'
        AND NOT EXISTS (
            SELECT 1
            FROM pragma_table_list AS v
            WHERE v.type = 'virtual'
                AND l.name LIKE v.name || '\\_%' ESCAPE '\\'
        )
    ORDER BY l.name ASC, p.cid ASC`;
}
