import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES, BunSQLiteTables } from "@/db/types/db";
import {
    HostDirectoryNameMaxChars,
    HostDirectorySourceMaxChars,
} from "@/src/dict/host-directory-dict";
import AppError from "@/src/utils/app-error";
import hostDirectoryPath from "@/src/utils/host-directory-path";
import makeHostDirectorySlug from "@/src/utils/make-host-directory-slug";
import assertHostDirectoryManager from "./assert-host-directory-manager";

type Params = {
    user_id: number | string;
    name: string;
    /**
     * Its absolute path on the host machine.
     */
    source: string;
    /**
     * Paths that can't be mounted (the app's own data, besides the host's
     * system folders `hostDirectoryPath` always refuses).
     */
    reserved?: string[];
};

/**
 * Adds a folder on the host machine (Settings > Host directories). Nothing
 * is mounted until it is linked to a computer or a workspace. Its `slug`
 * (the name it is mounted under) is made from its name once and kept, so
 * moving it around in a computer's folder never follows a rename.
 */
export default async function createHostDirectory({
    user_id,
    name,
    source,
    reserved = [],
}: Params): Promise<BUN_SQLITE_COBBLE_HOST_DIRECTORIES> {
    await assertHostDirectoryManager({ user_id });

    const clean_name = String(name || "").trim();

    if (!clean_name) {
        throw new AppError("A host directory needs a name.");
    }

    if (clean_name.length > HostDirectoryNameMaxChars) {
        throw new AppError(`A host directory's name can't be longer than ${HostDirectoryNameMaxChars} characters.`);
    }

    if (/[\0\n\r]/.test(clean_name)) {
        throw new AppError("A host directory's name can't have line breaks.");
    }

    const clean_source = hostDirectoryPath({ source, reserved });

    if (clean_source.length > HostDirectorySourceMaxChars) {
        throw new AppError(`A host directory's path can't be longer than ${HostDirectorySourceMaxChars} characters.`);
    }

    const taken = await BunSQLite.sql<{ slug: string }>({
        sql: `SELECT slug FROM host_directories`,
        values: [],
    });

    const slug = makeHostDirectorySlug({
        name: clean_name,
        taken: (taken.payload || []).map((row) => row.slug),
    });

    const now = Date.now();

    const result = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_HOST_DIRECTORIES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "host_directories",
        data: [
            {
                name: clean_name,
                source: clean_source,
                slug,
                created_by: Number(user_id),
            },
        ],
    });

    return {
        id: Number(result.singleRes?.id || result.postInsertReturn?.insertId),
        name: clean_name,
        source: clean_source,
        slug,
        created_by: Number(user_id),
        created_at: now,
        updated_at: now,
    } as BUN_SQLITE_COBBLE_HOST_DIRECTORIES;
}