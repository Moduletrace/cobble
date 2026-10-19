import BunSQLite from "@moduletrace/bun-sqlite";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import type { ComputerWithStatus } from "@/src/types";

type Params = {
    /**
     * Every computer of this owner, main first.
     */
    user_id?: number | string;
    /**
     * Or just this one.
     */
    computer_id?: number | string;
};

/**
 * Computers with their container's state, and why setting one up failed.
 */
export default async function grabUserComputers({
    user_id,
    computer_id,
}: Params): Promise<ComputerWithStatus[]> {
    if (!user_id && !computer_id) return [];

    const rows =
        (
            await BunSQLite.sql<ComputerWithStatus & { metadata?: string | null }>({
                sql: `SELECT c.*, co.status AS status, co.metadata AS metadata FROM computers c
                    LEFT JOIN containers co ON co.id = c.container_id
                    WHERE ${computer_id ? `c.id = ?` : `c.user_id = ?`}
                    ORDER BY c.kind = 'main' DESC, c.id ASC`,
                values: [computer_id || user_id!],
            })
        ).payload || [];

    return rows.map(({ metadata, ...computer }) => {
        const error = parseJobJson({ text: metadata })?.error;

        return {
            ...computer,
            error: computer.status == "failed" && typeof error == "string" ? error : null,
        };
    });
}
