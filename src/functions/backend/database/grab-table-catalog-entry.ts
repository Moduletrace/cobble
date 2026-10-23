import AppError from "@/src/utils/app-error";
import grabDatabaseTables from "./grab-database-tables";
import type { DatabaseTableSummary } from "@/src/types";

type Params = {
    /**
     * The table asked for, as it came in the query string. The first table
     * is used when nothing is asked for.
     */
    table?: string | null;
};

/**
 * One table, or the first one when nothing is asked for. Anything else is
 * refused with a message safe to show: the browser only ever reads tables
 * that are in the database, never a name it built itself.
 */
export default async function grabTableCatalogEntry({ table }: Params): Promise<DatabaseTableSummary> {
    const tables = await grabDatabaseTables();

    if (!tables.length) {
        throw new AppError(`Couldn't read the database's tables.`);
    }

    const first = tables[0];

    if (!table && first) return first;

    const entry = tables.find((candidate) => candidate.name == table);

    if (!entry) {
        throw new AppError(`There's no table called "${table}".`);
    }

    return entry;
}
