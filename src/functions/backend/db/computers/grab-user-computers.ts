import BunSQLite from "@moduletrace/bun-sqlite";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import type { ComputerWithStatus } from "@/src/types";
import computerSetupInterrupted from "@/src/utils/computer-setup-interrupted";
import computersSql from "@/src/utils/crew-access/computers-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    /**
     * Every computer this user sees (`computersSql`), main first.
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

    const access = computer_id
        ? { sql: `c.id = ?`, values: [Number(computer_id)] }
        : computersSql({ role: await grabCrewRole({ user_id: user_id! }), user_id: user_id! });

    const rows =
        (
            await BunSQLite.sql<ComputerWithStatus & { metadata?: string | null; container_updated_at?: number | null }>({
                sql: `SELECT c.*, co.status AS status, co.metadata AS metadata, co.updated_at AS container_updated_at FROM computers c
                    LEFT JOIN containers co ON co.id = c.container_id
                    WHERE ${access.sql}
                    ORDER BY c.kind = 'main' DESC, c.id ASC`,
                values: access.values,
            })
        ).payload || [];

    return rows.map(({ metadata, container_updated_at, ...computer }) => {
        /**
         * Left `creating` by a process that's gone: shown as failed, so it
         * can be set up again (`syncComputers` also starts it again).
         */
        if (computerSetupInterrupted({ status: computer.status, updated_at: container_updated_at })) {
            return {
                ...computer,
                status: "failed",
                error: "Setting it up was interrupted (the app restarted). Try again, or wait: it starts again by itself within a few minutes.",
            };
        }

        const error = parseJobJson({ text: metadata })?.error;

        return {
            ...computer,
            error: computer.status == "failed" && typeof error == "string" ? error : null,
        };
    });
}
