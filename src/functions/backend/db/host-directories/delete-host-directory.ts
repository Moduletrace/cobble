import BunSQLite from "@moduletrace/bun-sqlite";
import fs from "fs/promises";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import applyHostDirectoryGrant from "./apply-host-directory-grant";
import assertHostDirectoryManager from "./assert-host-directory-manager";
import grabComputerHostDirectories from "./grab-computer-host-directories";
import grabHostDirectoryComputers from "./grab-host-directory-computers";
import reconcileComputerHostDirectories from "./reconcile-computer-host-directories";

type Params = {
    user_id: number | string;
    host_directory_id: number | string;
};

/**
 * Deletes a host directory with its links and checks. The folder on the
 * host machine is untouched, and so is what a bot already put in it: only
 * the mounts go, the next time each computer is set up again. The empty
 * folders left where they were mounted are removed.
 */
export default async function deleteHostDirectory({
    user_id,
    host_directory_id,
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

    const computer_ids = await grabHostDirectoryComputers({
        host_directory_id: directory.id,
    });

    const destinations: string[] = [];

    for (const computer_id of computer_ids) {
        const { mounts } = await grabComputerHostDirectories({ computer_id });

        destinations.push(
            ...mounts
                .filter((mount) => mount.host_directory_id == directory.id)
                .map((mount) => mount.destination),
        );
    }

    /** Foreign keys are off outside the server, so every child row goes by hand. */
    for (const sql of [
        `DELETE FROM host_directory_checks WHERE host_directory_id = ?`,
        `DELETE FROM host_directory_computers WHERE host_directory_id = ?`,
        `DELETE FROM host_directory_workspaces WHERE host_directory_id = ?`,
    ]) {
        const res = await BunSQLite.sql({ sql, values: [directory.id] });

        if (!res.success) {
            throw new AppError("Couldn't delete the host directory.");
        }
    }

    for (const computer_id of computer_ids) {
        await reconcileComputerHostDirectories({ computer_id });
    }

    /**
     * With no links left the accounts it was granted to lose it, so a folder
     * the user shares again later starts from where they left it. Its row
     * has to be there for the grant to read, so it goes last.
     */
    await applyHostDirectoryGrant({ host_directory_id: directory.id }).catch(
        () => {},
    );

    for (const sql of [
        `DELETE FROM host_directory_grants WHERE host_directory_id = ?`,
        `DELETE FROM host_directories WHERE id = ?`,
    ]) {
        const res = await BunSQLite.sql({ sql, values: [directory.id] });

        if (!res.success) {
            throw new AppError("Couldn't delete the host directory.");
        }
    }

    for (const destination of destinations) {
        await fs.rmdir(destination).catch(() => {
            /**
             * Still mounted (the computer is busy and will be set up again
             * later), or holding something. Neither is an error here.
             */
        });
    }
}