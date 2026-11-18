import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES } from "@/db/types/db";
import type { HostDirectoryAccess } from "@/src/dict/host-directory-dict";
import AppError from "@/src/utils/app-error";
import applyHostDirectoryGrant from "./apply-host-directory-grant";
import assertHostDirectoryManager from "./assert-host-directory-manager";
import reconcileComputerHostDirectories from "./reconcile-computer-host-directories";

type Params = {
    user_id: number | string;
    host_directory_id: number | string;
    /**
     * The computer it is mounted into, for every bot that reaches it.
     */
    computer_id?: number | string;
    /**
     * The workspace it is mounted into, on every computer the workspace is
     * on, for every bot working there.
     */
    workspace_id?: number | string;
    access?: HostDirectoryAccess;
};

/**
 * Links a host directory to a computer or a workspace, read and write
 * unless told otherwise. The computers it lands on are given it at once
 * (`reconcileComputerHostDirectories` recreates an idle one: a mount only
 * exists from a container's creation).
 */
export default async function linkHostDirectory({
    user_id,
    host_directory_id,
    computer_id,
    workspace_id,
    access = "read-write",
}: Params) {
    await assertHostDirectoryManager({ user_id });

    const directory = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HOST_DIRECTORIES>({
            sql: `SELECT * FROM host_directories WHERE id = ?`,
            values: [host_directory_id],
        })
    ).payload?.[0];

    if (!directory?.id) {
        throw new AppError("Host directory not found.");
    }

    if (Boolean(computer_id) == Boolean(workspace_id)) {
        throw new AppError("Pick the computer or the workspace to mount it in.");
    }

    if (access != "read-write" && access != "read-only") {
        throw new AppError("Pick read and write, or read only.");
    }

    const table = computer_id ? "host_directory_computers" : "host_directory_workspaces";
    const column = computer_id ? "computer_id" : "workspace_id";
    const value = Number(computer_id || workspace_id);

    const existing = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM ${table} WHERE host_directory_id = ? AND ${column} = ?`,
        values: [directory.id, value],
    });

    if (existing.payload?.[0]?.id) {
        throw new AppError("That host directory is already linked there.");
    }

    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT INTO ${table} (host_directory_id, ${column}, access, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        values: [directory.id, value, access, now, now],
    });

    await applyHostDirectoryGrant({
        host_directory_id: directory.id,
        user_id,
    }).catch(() => {});

    await reconcileComputerHostDirectories(
        computer_id ? { computer_id: value } : { workspace_id: value },
    );
}