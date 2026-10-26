import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASES } from "@/db/types/db";
import type { KnowledgebasesOverviewPayload } from "@/src/types";
import grabCrewRole from "../access/grab-crew-role";
import grabExtensionAccess from "../extensions/grab-extension-access";
import grabExtensionTargets from "../extensions/grab-extension-targets";
import { KnowledgebaseDocumentIndexingSql } from "./knowledgebase-document-indexing-sql";
import grabInstallEmbeddingModel from "./grab-install-embedding-model";
import parseKnowledgebaseRow from "./parse-knowledgebase-row";

type Params = {
    user_id: number | string;
};

type Counts = {
    knowledgebase_id: number;
    documents: number;
    pending: number;
    errors: number;
    warnings: number;
    stale: number;
    size: number;
};

/**
 * The Knowledgebases settings page: every knowledgebase with who gets it
 * and how much of it is searchable, what it can be attached to, and the
 * install's embedding model. Admins read it and choose who gets each;
 * only a super admin adds, edits, fills or deletes one.
 */
export default async function grabKnowledgebasesOverview({
    user_id,
}: Params): Promise<KnowledgebasesOverviewPayload> {
    const role = await grabCrewRole({ user_id });
    const embedding_model = await grabInstallEmbeddingModel();

    const [rows, counts, access, targets] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_KNOWLEDGEBASES>({
            sql: `SELECT * FROM knowledgebases ORDER BY name COLLATE NOCASE ASC, id ASC`,
        }),
        BunSQLite.sql<Counts>({
            sql: `SELECT knowledgebase_id,
                    COUNT(*) AS documents,
                    SUM(CASE WHEN ${KnowledgebaseDocumentIndexingSql} THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN ingest_error IS NOT NULL AND COALESCE(chunk_count, 0) = 0 THEN 1 ELSE 0 END) AS errors,
                    SUM(CASE WHEN ingest_error IS NOT NULL AND NOT ${KnowledgebaseDocumentIndexingSql}
                        THEN 1 ELSE 0 END) AS warnings,
                    SUM(CASE WHEN ingested_at IS NOT NULL AND chunk_count > 0
                        AND (embedding_model IS NULL OR embedding_model IS NOT ?) THEN 1 ELSE 0 END) AS stale,
                    SUM(size) AS size
                FROM knowledgebase_documents d GROUP BY knowledgebase_id`,
            values: [embedding_model],
        }),
        grabExtensionAccess({ kind: "knowledgebase" }),
        grabExtensionTargets({ role }),
    ]);

    const by_id = new Map((counts.payload || []).map((row) => [Number(row.knowledgebase_id), row]));

    return {
        ...targets,
        embedding_model,
        knowledgebases: (rows.payload || []).map((row) => {
            const { all_bots, ...knowledgebase } = parseKnowledgebaseRow({ row });
            const count = by_id.get(knowledgebase.id);

            return {
                ...knowledgebase,
                access: { all_bots, ...access(knowledgebase.id) },
                document_count: Number(count?.documents) || 0,
                pending_count: Number(count?.pending) || 0,
                error_count: Number(count?.errors) || 0,
                warning_count: Number(count?.warnings) || 0,
                stale_count: Number(count?.stale) || 0,
                size: Number(count?.size) || 0,
            };
        }),
    };
}
