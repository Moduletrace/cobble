import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    host_directory_id: number | string;
};

/**
 * Every computer a host directory is mounted on: those it is linked to
 * itself, and those of the workspaces it is linked to.
 */
export default async function grabHostDirectoryComputers({
    host_directory_id,
}: Params): Promise<number[]> {
    const rows = await BunSQLite.sql<{ computer_id: number }>({
        sql: `SELECT computer_id FROM host_directory_computers WHERE host_directory_id = ?
            UNION
            SELECT wc.computer_id FROM host_directory_workspaces hdw
            JOIN workspace_computers wc ON wc.workspace_id = hdw.workspace_id
            WHERE hdw.host_directory_id = ?
            ORDER BY computer_id ASC`,
        values: [host_directory_id, host_directory_id],
    });

    return (rows.payload || []).map((row) => Number(row.computer_id));
}