import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import deleteMedia from "./delete-media";
import { mediaOrphanIdsSql } from "./media-orphan-sql";

/**
 * How many orphaned rows go in one delete: a delete walks each file, so
 * they are taken in small runs rather than one long hold on the process.
 */
const BatchSize = 200;

/**
 * Up to how many batches one run takes, so a large backlog drains over a
 * few nights without a cron run that never ends.
 */
const MaxBatches = 20;

const DayMs = 24 * 60 * 60 * 1000;

/**
 * Deletes media nothing points at any more, older than
 * `AppData.MediaOrphanKeepDays` (`prune-orphan-media`): a chat upload whose
 * message was pruned with its room or hook session before the deletes
 * unlinked its bytes, and an upload whose message never got saved. Recent
 * rows are left alone so an upload in flight is never taken. The age also
 * keeps a profile picture's replaced predecessor, which a delete may leave
 * for a moment, out of it.
 *
 * Returns the ids it deleted.
 */
export default async function pruneOrphanMedia() {
    const cutoff = Date.now() - AppData.MediaOrphanKeepDays * DayMs;
    const deleted: number[] = [];

    for (let batch = 0; batch < MaxBatches; batch++) {
        const { sql, values } = mediaOrphanIdsSql({ cutoff, limit: BatchSize });

        const found = (await BunSQLite.sql<{ id: number }>({ sql, values })).payload || [];

        if (!found.length) break;

        const ids = found.map((row) => Number(row.id));

        await deleteMedia({ ids, can_delete_all_media: true });

        deleted.push(...ids);

        if (found.length < BatchSize) break;
    }

    return deleted;
}