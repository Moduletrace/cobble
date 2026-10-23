/**
 * How many bytes each table takes on disk. `dbstat` reports pages per
 * b-tree; an index's pages are named after the index (`autoindex` or the
 * schema's own), so the join puts them back under the table they belong
 * to. A table with no pages yet has no row here.
 */
export default function buildTableSizesSql(): string {
    return `SELECT
        COALESCE(i.tbl_name, d.name) AS table_name,
        SUM(d.pgsize) AS bytes
    FROM dbstat AS d
    LEFT JOIN sqlite_master AS i ON i.type = 'index' AND i.name = d.name
    GROUP BY COALESCE(i.tbl_name, d.name)`;
}

export type TableSizeRow = {
    table_name: string;
    bytes: number;
};
