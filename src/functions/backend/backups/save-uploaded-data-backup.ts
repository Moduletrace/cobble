import fs from "fs";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabBackupArchiveDir from "@/src/utils/grab-backup-archive-dir";

type Params = {
    file: File;
};

const GZIP_MAGIC = [0x1f, 0x8b];

/**
 * Saves an uploaded data archive into the archive directory under the
 * same `{prefix}{timestamp}.tar.gz` name an archive made here uses, so it
 * is listed, kept and restored like any other. A gzip header is required,
 * so an arbitrary upload is refused before it reaches the restore.
 * Returns the saved file name.
 */
export default async function saveUploadedDataBackup({ file }: Params) {
    if (!file.size) {
        throw new Error(`The uploaded archive is empty`);
    }

    const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());

    if (head[0] != GZIP_MAGIC[0] || head[1] != GZIP_MAGIC[1]) {
        throw new Error(`Only a gzipped tar archive can be restored`);
    }

    const archive_dir = grabBackupArchiveDir();
    const archive_name = `${AppData.DataBackupNamePrefix}${Date.now()}.tar.gz`;

    await Bun.write(path.join(archive_dir, archive_name), file);

    return archive_name;
}
