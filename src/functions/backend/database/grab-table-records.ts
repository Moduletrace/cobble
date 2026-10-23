import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import buildRecordRow from "./build-record-row";
import buildRecordsSql, { buildCountSql } from "./build-records-sql";
import clampPage from "./clamp-page";
import grabTableCatalogEntry from "./grab-table-catalog-entry";
import type { DatabaseRecord, DatabaseRecordsPayload, DatabaseSearchMode } from "@/src/types";
import { AppData } from "@/src/data/app-data";

type Params = {
    table?: string | null;
    /**
     * Which page of records, from 1.
     */
    page?: number;
    /**
     * What to look for in the table's records, across every column's text.
     */
    search?: string;
    mode?: DatabaseSearchMode;
};

type TotalRow = { total: number };

/**
 * One page of one table's records, read-only: the table asked for with all
 * of its columns, its records newest key first, and how many matched so the
 * pager knows where the end is.
 *
 * Every value crosses out of SQLite already cut to
 * `AppData.DatabaseBrowserCellMaxChars`, so a table of long texts can't
 * turn one page into a megabyte of JSON.
 */
export default async function grabTableRecords({
    table,
    page = 1,
    search = "",
    mode = "every_word",
}: Params): Promise<DatabaseRecordsPayload> {
    const entry = await grabTableCatalogEntry({ table });
    const page_size = AppData.DatabaseBrowserPageSize;
    const current_page = Math.max(1, Math.trunc(page || 1));
    const columns = entry.columns.map((column) => column.name);
    const trimmed = search.trim();
    const search_params = trimmed
        ? { text: trimmed, mode, max_words: AppData.DatabaseBrowserMaxSearchWords }
        : null;
    const count_res = await BunSQLite.sql<TotalRow>(
        buildCountSql({
            table: entry.name,
            columns,
            search: search_params,
        }),
    );
    const total = Number(count_res.payload?.[0]?.total) || 0;
    const final_page = clampPage({ page: current_page, total, page_size });
    const page_query = buildRecordsSql({
        table: entry.name,
        columns,
        key: entry.key,
        max_chars: AppData.DatabaseBrowserCellMaxChars,
        limit: page_size,
        offset: (final_page - 1) * page_size,
        search: search_params,
    });
    const res = await BunSQLite.sql<Record<string, unknown>>(page_query);

    if (!res.success || !res.payload) {
        throw new AppError(`Couldn't read the records of "${entry.name}".`);
    }

    const records: DatabaseRecord[] = res.payload.map((row) =>
        buildRecordRow({
            row,
            columns: entry.columns,
            max_chars: AppData.DatabaseBrowserCellMaxChars,
        }),
    );

    return {
        table: entry,
        records,
        total,
        page: final_page,
        page_size,
        search: trimmed,
        mode,
    };
}
