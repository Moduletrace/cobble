import bunext from "@moduletrace/bunext";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { logError } from "@/src/functions/backend/logger";
import processIngestJob from "./process-ingest-job";
import { setFileIngestWaker } from "./wake-file-ingest";

const worker = AppData.FileIngestWorker;
let running = 0;
let polling = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Starts the file ingestion worker: polls every `AppData.FileIngestPollMs`
 * for `file_ingest_queue` jobs and runs up to
 * `AppData.FileIngestConcurrency` at once (chunking and embedding a
 * knowledgebase document). Gated in production to the `MAIN_SERVER`
 * container, like cron and the bots queue.
 */
export default async function fileIngest() {
    if (process.env.NODE_ENV == "production" && !process.env.MAIN_SERVER) {
        return;
    }

    bunext.bunextLog.watch(`Running File Ingest Queue ...`);

    /**
     * A restart's cut-off jobs go back to waiting (their lock timeout
     * would, but this is immediate).
     */
    await BunSQLite.queue.release_stale({ table: "file_ingest_queue" }).catch((error) =>
        logError({ title: "File ingest couldn't release stale jobs", error }).catch(() => {}),
    );

    setFileIngestWaker({ waker: wake });
    poll();
}

function wake() {
    if (polling) return;

    clearTimeout(timer);
    poll();
}

async function poll() {
    polling = true;

    try {
        const free = AppData.FileIngestConcurrency - running;

        if (free > 0) {
            const { payload } = await BunSQLite.queue.claim<BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE>({
                table: "file_ingest_queue",
                worker,
                limit: free,
            });

            for (const job of payload || []) {
                running++;

                processIngestJob({ job })
                    .catch((error) =>
                        logError({
                            title: `File ingest job #${job.id} crashed`,
                            error,
                        }).catch(() => {}),
                    )
                    .finally(() => {
                        running--;
                    });
            }
        }
    } catch (error) {
        await logError({ title: "File ingest poll failed", error }).catch(() => {});
    } finally {
        polling = false;
        clearTimeout(timer);
        timer = setTimeout(poll, AppData.FileIngestPollMs);
    }
}
