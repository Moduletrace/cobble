import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    workspace_id: number | string;
};

/**
 * Every host directory mounted in one workspace.
 */
export default async function grabWorkspaceHostDirectoryIds({
    workspace_id,
}: Params): Promise<number[]> {
    const rows = await BunSQLite.sql<{ host_directory_id: number }>({
        sql: `SELECT host_directory_id FROM host_directory_workspaces WHERE workspace_id = ? ORDER BY host_directory_id ASC`,
        values: [workspace_id],
    });

    return (rows.payload || []).map((row) => Number(row.host_directory_id));
}