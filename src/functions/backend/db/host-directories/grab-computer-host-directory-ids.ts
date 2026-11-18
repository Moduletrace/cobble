import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number | string;
};

/**
 * Every host directory mounted on one computer: those it is linked to
 * itself, and those of the workspaces it is on.
 */
export default async function grabComputerHostDirectoryIds({
    computer_id,
}: Params): Promise<number[]> {
    const rows = await BunSQLite.sql<{ host_directory_id: number }>({
        sql: `SELECT host_directory_id FROM host_directory_computers WHERE computer_id = ?
            UNION
            SELECT hdw.host_directory_id FROM host_directory_workspaces hdw
            JOIN workspace_computers wc ON wc.workspace_id = hdw.workspace_id
            WHERE wc.computer_id = ?
            ORDER BY host_directory_id ASC`,
        values: [computer_id, computer_id],
    });

    return (rows.payload || []).map((row) => Number(row.host_directory_id));
}