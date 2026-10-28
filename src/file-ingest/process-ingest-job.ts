import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE } from "@/db/types/db";
import ingestKnowledgebaseDocument from "@/src/functions/backend/db/knowledgebases/ingest-knowledgebase-document";
import { logError } from "@/src/functions/backend/logger";
import settleFailedIngestJob from "./settle-failed-ingest-job";

type Params = {
    job: BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE;
};

/**
 * Ingests one queued knowledgebase document and completes (or fails) its
 * job. One that was deleted meanwhile is simply done, and so is a job
 * without a document (bot files are no longer indexed).
 */
export default async function processIngestJob({ job }: Params) {
    if (!job.id) return;

    if (!job.document_id) {
        await BunSQLite.queue.complete({ table: "file_ingest_queue", id: job.id }).catch(() => {});
        return;
    }

    try {
        await ingestKnowledgebaseDocument({ document_id: job.document_id });
        await BunSQLite.queue.complete({ table: "file_ingest_queue", id: job.id });
    } catch (error) {
        const { deferred } = await settleFailedIngestJob({ job_id: job.id, error });

        if (deferred) return;

        await logError({
            title: `Knowledgebase document #${job.document_id} couldn't be ingested`,
            error,
            metadata: { document_id: job.document_id },
        }).catch(() => {});
    }
}
