import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE } from "@/db/types/db";
import ingestBotFile from "@/src/functions/backend/db/bot-files/ingest-bot-file";
import ingestKnowledgebaseDocument from "@/src/functions/backend/db/knowledgebases/ingest-knowledgebase-document";
import { logError } from "@/src/functions/backend/logger";
import settleFailedIngestJob from "./settle-failed-ingest-job";

type Params = {
    job: BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE;
};

/**
 * Ingests one queued file (or knowledgebase document) and completes (or
 * fails) its job. One that was deleted meanwhile is simply done.
 */
export default async function processIngestJob({ job }: Params) {
    if (!job.id) return;

    if (job.document_id) return await processDocumentJob({ job_id: job.id, document_id: job.document_id });

    if (!job.file_id) {
        await BunSQLite.queue.complete({ table: "file_ingest_queue", id: job.id }).catch(() => {});
        return;
    }

    try {
        const result = await ingestBotFile({ file_id: job.file_id });

        await BunSQLite.queue.complete({ table: "file_ingest_queue", id: job.id });

        if (result.status == "ingested") {
            BunSQLite.sql({
                sql: `UPDATE bot_files SET ingest_error = NULL WHERE id = ?`,
                values: [job.file_id],
            }).catch(() => {});
        }
    } catch (error) {
        const { deferred } = await settleFailedIngestJob({ job_id: job.id, error });

        if (deferred) return;

        await logError({
            title: `Bot file #${job.file_id} couldn't be ingested`,
            error,
            metadata: { file_id: job.file_id },
        }).catch(() => {});
    }
}

async function processDocumentJob({ job_id, document_id }: { job_id: number; document_id: number }) {
    try {
        await ingestKnowledgebaseDocument({ document_id });
        await BunSQLite.queue.complete({ table: "file_ingest_queue", id: job_id });
    } catch (error) {
        const { deferred } = await settleFailedIngestJob({ job_id, error });

        if (deferred) return;

        await logError({
            title: `Knowledgebase document #${document_id} couldn't be ingested`,
            error,
            metadata: { document_id },
        }).catch(() => {});
    }
}
