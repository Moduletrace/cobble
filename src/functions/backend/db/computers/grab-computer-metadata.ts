import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number | string;
};

/**
 * A computer's container `metadata` as it was last written (a JSON text),
 * or null when it has no container. Read to compare what a container was
 * made with (its host directories) to what it should have now.
 */
export default async function grabComputerMetadata({ computer_id }: Params) {
    const row = (
        await BunSQLite.sql<{ metadata?: string | null }>({
            sql: `SELECT co.metadata AS metadata FROM computers c
                JOIN containers co ON co.id = c.container_id
                WHERE c.id = ?`,
            values: [Number(computer_id)],
        })
    ).payload?.[0];

    return row?.metadata || null;
}