import runBunSQLiteCommand from "./run-bun-sqlite-command";

/**
 * Writes a new database snapshot via `bun-sqlite backup`. bun-sqlite prunes
 * old snapshots down to `max_backups`.
 */
export default async function createDbBackup() {
    return await runBunSQLiteCommand({ args: ["backup"] });
}
