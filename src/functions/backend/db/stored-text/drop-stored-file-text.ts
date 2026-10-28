import BunSQLite from "@moduletrace/bun-sqlite";
import logEvent, { logError } from "@/src/functions/backend/logger";
import dropStoredFileTextSql from "./drop-stored-file-text-sql";
import shouldVacuum from "./should-vacuum";

/**
 * Knowledgebases are the only place text is kept for search. Removes what
 * bot files and uploads stored before that (`dropStoredFileTextSql`), then
 * vacuums once if the database has a lot of free pages, so the space comes
 * back on disk. Safe on every start: once clean, it only reads two pragmas.
 */
export default async function dropStoredFileText() {
    for (const sql of dropStoredFileTextSql()) {
        const res = await BunSQLite.sql({ sql });

        if (!res.success) throw new Error(`${sql.split("\n")[0]}: ${res.error || res.msg}`);
    }

    const [page_count, freelist_count, page_size] = await Promise.all(
        ["page_count", "freelist_count", "page_size"].map((pragma) =>
            BunSQLite.sql<Record<string, number>>({ sql: `PRAGMA ${pragma}` }).then((res) =>
                Number(res.payload?.[0]?.[pragma]) || 0,
            ),
        ),
    );

    if (!shouldVacuum({ page_count: page_count!, freelist_count: freelist_count!, page_size: page_size! })) return;

    const res = await BunSQLite.sql({ sql: `VACUUM` });

    if (!res.success) {
        await logError({
            title: "Could not vacuum the database",
            error: new Error(`${res.error || res.msg}. It needs about as much free disk as the database takes.`),
            metadata: { free_bytes: freelist_count! * page_size! },
        }).catch(() => {});
        return;
    }

    await logEvent({
        title: "Vacuumed the database",
        category: "system",
        plain_text: `Gave back ${Math.round((freelist_count! * page_size!) / (1024 * 1024))} MB of free pages to the disk.`,
        metadata: { freed_bytes: freelist_count! * page_size! },
    }).catch(() => {});
}
