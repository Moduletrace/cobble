import BunSQLite from "@moduletrace/bun-sqlite";
import fs from "fs/promises";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import applyHostDirectoryGrant from "./apply-host-directory-grant";
import assertHostDirectoryManager from "./assert-host-directory-manager";
import grabComputerHostDirectories from "./grab-computer-host-directories";
import reconcileComputerHostDirectories from "./reconcile-computer-host-directories";

type Params = {
    user_id: number | string;
    host_directory_id: number | string;
    computer_id?: number | string;
    workspace_id?: number | string;
};

/**
 * Takes a host directory out of one computer or one workspace. The host
 * folder itself is untouched: only the mount goes, the next time the
 * computer is set up again (`reconcileComputerHostDirectories`), and the
 * empty folder it was mounted at is removed.
 */
export default async function unlinkHostDirectory({
    user_id,
    host_directory_id,
    computer_id,
    workspace_id,
}: Params) {
    await assertHostDirectoryManager({ user_id });

    if (Boolean(computer_id) == Boolean(workspace_id)) {
        throw new AppError("Pick the computer or the workspace to take it out of.");
    }

    const directory = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HOST_DIRECTORIES>({
            sql: `SELECT * FROM host_directories WHERE id = ?`,
            values: [host_directory_id],
        })
    ).payload?.[0];

    if (!directory?.id) {
        throw new AppError("Host directory not found.");
    }

    const table = computer_id ? "host_directory_computers" : "host_directory_workspaces";
    const column = computer_id ? "computer_id" : "workspace_id";
    const value = Number(computer_id || workspace_id);

    const computer_ids = computer_id
        ? [Number(computer_id)]
        : (
              await BunSQLite.sql<{ computer_id: number }>({
                  sql: `SELECT computer_id FROM workspace_computers WHERE workspace_id = ?`,
                  values: [value],
              })
          ).payload?.map((row) => Number(row.computer_id)) || [];

    const destinations: string[] = [];

    for (const id of computer_ids) {
        const { mounts } = await grabComputerHostDirectories({
            computer_id: id,
        });

        destinations.push(
            ...mounts
                .filter((mount) => mount.host_directory_id == directory.id)
                .map((mount) => mount.destination),
        );
    }

    const removed = await BunSQLite.sql({
        sql: `DELETE FROM ${table} WHERE host_directory_id = ? AND ${column} = ?`,
        values: [directory.id, value],
    });

    if (!removed.success) {
        throw new AppError("Couldn't take the host directory out.");
    }

    await applyHostDirectoryGrant({
        host_directory_id: directory.id,
        user_id,
    }).catch(() => {});

    await reconcileComputerHostDirectories(
        computer_id ? { computer_id: value } : { workspace_id: value },
    );

    for (const destination of destinations) {
        await fs.rmdir(destination).catch(() => {
            /**
             * Still mounted (the computer is busy and will be set up again
             * later), or holding something. Neither is an error here.
             */
        });
    }
}