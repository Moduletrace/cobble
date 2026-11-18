import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES, BunSQLiteTables } from "@/db/types/db";
import {
    HostDirectoryNameMaxChars,
    HostDirectorySourceMaxChars,
} from "@/src/dict/host-directory-dict";
import AppError from "@/src/utils/app-error";
import hostDirectoryPath from "@/src/utils/host-directory-path";
import applyHostDirectoryGrant from "./apply-host-directory-grant";
import assertHostDirectoryManager from "./assert-host-directory-manager";

type Params = {
    user_id: number | string;
    host_directory_id: number | string;
    name?: string;
    /**
     * Its absolute path on the host machine.
     */
    source?: string;
    reserved?: string[];
};

/**
 * Renames a host directory, or points it at another folder. Its `slug` (the
 * name it is mounted under) is kept: moving it in a computer's folder would
 * leave the old one behind. A new path means every check of it is out of
 * date, so they are dropped and the computers mount it again
 * (`reconcileComputerHostDirectories`).
 */
export default async function updateHostDirectory({
    user_id,
    host_directory_id,
    name,
    source,
    reserved = [],
}: Params): Promise<BUN_SQLITE_COBBLE_HOST_DIRECTORIES> {
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

    const clean_name = name === undefined ? directory.name : String(name || "").trim();

    if (!clean_name) {
        throw new AppError("A host directory needs a name.");
    }

    if (clean_name.length > HostDirectoryNameMaxChars) {
        throw new AppError(`A host directory's name can't be longer than ${HostDirectoryNameMaxChars} characters.`);
    }

    if (/[\0\n\r]/.test(clean_name)) {
        throw new AppError("A host directory's name can't have line breaks.");
    }

    const clean_source =
        source === undefined ? String(directory.source || "") : hostDirectoryPath({ source, reserved });

    if (clean_source.length > HostDirectorySourceMaxChars) {
        throw new AppError(`A host directory's path can't be longer than ${HostDirectorySourceMaxChars} characters.`);
    }

    await BunSQLite.update<BUN_SQLITE_COBBLE_HOST_DIRECTORIES, (typeof BunSQLiteTables)[number]>({
        table: "host_directories",
        targetId: directory.id,
        data: { name: clean_name, source: clean_source },
    });

    if (clean_source != directory.source) {
        await BunSQLite.sql({
            sql: `DELETE FROM host_directory_checks WHERE host_directory_id = ?`,
            values: [directory.id],
        });

        await BunSQLite.sql({
            sql: `DELETE FROM host_directory_grants WHERE host_directory_id = ?`,
            values: [directory.id],
        });

        await applyHostDirectoryGrant({
            host_directory_id: directory.id,
            user_id,
        }).catch(() => {});
    }

    return { ...directory, name: clean_name, source: clean_source };
}