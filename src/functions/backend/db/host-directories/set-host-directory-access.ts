import BunSQLite from "@moduletrace/bun-sqlite";
import type { HostDirectoryAccess } from "@/src/dict/host-directory-dict";
import AppError from "@/src/utils/app-error";
import assertHostDirectoryManager from "./assert-host-directory-manager";
import reconcileComputerHostDirectories from "./reconcile-computer-host-directories";

type Params = {
    user_id: number | string;
    host_directory_id: number | string;
    computer_id?: number | string;
    workspace_id?: number | string;
    access: HostDirectoryAccess;
};

/**
 * How one link uses its folder: read and write, or read only. A read-only
 * mount is mounted read only, so it takes setting the computer up again
 * (`reconcileComputerHostDirectories`).
 */
export default async function setHostDirectoryAccess({
    user_id,
    host_directory_id,
    computer_id,
    workspace_id,
    access,
}: Params) {
    await assertHostDirectoryManager({ user_id });

    if (Boolean(computer_id) == Boolean(workspace_id)) {
        throw new AppError("Pick the computer or the workspace whose link changes.");
    }

    if (access != "read-write" && access != "read-only") {
        throw new AppError("Pick read and write, or read only.");
    }

    const table = computer_id ? "host_directory_computers" : "host_directory_workspaces";
    const column = computer_id ? "computer_id" : "workspace_id";
    const value = Number(computer_id || workspace_id);

    const link = await BunSQLite.sql<{ id: number; access: string }>({
        sql: `SELECT id, access FROM ${table} WHERE host_directory_id = ? AND ${column} = ?`,
        values: [host_directory_id, value],
    });

    const row = link.payload?.[0];

    if (!row?.id) {
        throw new AppError("That host directory isn't linked there.");
    }

    if (row.access == access) return;

    const updated = await BunSQLite.sql({
        sql: `UPDATE ${table} SET access = ?, updated_at = ? WHERE id = ?`,
        values: [access, Date.now(), row.id],
    });

    if (!updated.success) {
        throw new AppError("Couldn't change how the folder is used.");
    }

    await reconcileComputerHostDirectories(
        computer_id ? { computer_id: value } : { workspace_id: value },
    );
}
