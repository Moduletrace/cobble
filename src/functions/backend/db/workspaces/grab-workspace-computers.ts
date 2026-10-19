import BunSQLite from "@moduletrace/bun-sqlite";
import type { ComputerWithStatus } from "@/src/types";
import parseJobJson from "@/src/bots-queue/parse-job-json";

type Params = {
    workspace_id: number | string;
};

/**
 * The computers linked to a workspace, with their container's state, its
 * default first.
 */
export default async function grabWorkspaceComputers({
    workspace_id,
}: Params): Promise<ComputerWithStatus[]> {
    const res = await BunSQLite.sql<ComputerWithStatus & { metadata?: string | null }>({
        sql: `SELECT c.*, co.status AS status, co.metadata AS metadata FROM computers c
            JOIN workspace_computers wc ON wc.computer_id = c.id AND wc.workspace_id = ?
            JOIN workspaces w ON w.id = wc.workspace_id AND w.user_id = c.user_id
            LEFT JOIN containers co ON co.id = c.container_id
            ORDER BY c.id = w.computer_id DESC, wc.id ASC`,
        values: [workspace_id],
    });

    return (res.payload || []).map(({ metadata, ...computer }) => {
        const error = parseJobJson({ text: metadata })?.error;

        return {
            ...computer,
            error: computer.status == "failed" && typeof error == "string" ? error : null,
        };
    });
}
