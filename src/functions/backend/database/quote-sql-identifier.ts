/**
 * Quotes a table or column name for SQL, wrapping it in double quotes and
 * doubling any it holds. The database browser builds its statements from
 * the database's own names, and every one of them still goes through here
 * so a name with a quote or a space in it can't break out of the query.
 */
export default function quoteSqlIdentifier({ name }: { name: string }): string {
    return `"${name.replace(/"/g, `""`)}"`;
}
