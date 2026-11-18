import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertHostDirectoryManager from "./assert-host-directory-manager";

type Params = {
    user_id: number | string;
    host_directory_id: number | string;
    computer_id?: number | string;
    workspace_id?: number | string;
    gate_deletes: boolean;
};

/**
 * Whether one link asks the user before a command deletes or moves
 * anything out of the folder (`host-directory-delete-guard`). It is read
 * on every command, so nothing is set up again.
 */
export default async function setHostDirectoryDeletes({
    user_id,
    host_directory_id,
    computer_id,
    workspace_id,
    gate_deletes,
}: Params) {
    await assertHostDirectoryManager({ user_id });

    if (Boolean(computer_id) == Boolean(workspace_id)) {
        throw new AppError("Pick the computer or the workspace whose link changes.");
    }

    const table = computer_id ? "host_directory_computers" : "host_directory_workspaces";
    const column = computer_id ? "computer_id" : "workspace_id";
    const value = Number(computer_id || workspace_id);

    const link = await BunSQLite.sql<{ id: number; gate_deletes: number }>({
        sql: `SELECT id, gate_deletes FROM ${table} WHERE host_directory_id = ? AND ${column} = ?`,
        values: [host_directory_id, value],
    });

    const row = link.payload?.[0];

    if (!row?.id) {
        throw new AppError("That host directory isn't linked there.");
    }

    const current = Number(row.gate_deletes) != 0;

    if (current == gate_deletes) return;

    const updated = await BunSQLite.sql({
        sql: `UPDATE ${table} SET gate_deletes = ?, updated_at = ? WHERE id = ?`,
        values: [gate_deletes ? 1 : 0, Date.now(), row.id],
    });

    if (!updated.success) {
        throw new AppError("Couldn't change how deletes in the folder are handled.");
    }
}