import fs from "fs";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";
import logEvent, { type LogEventParams } from "@/src/functions/backend/logger";

/**
 * Writes the log entries a restore queued before the restart
 * (`queueBootLog`) into the database the app came back up on, once. The
 * file is moved aside first, so a second process starting at the same
 * time never writes them twice.
 */
export default async function flushBootLogs() {
    const { DATA_DIR } = grabDirNames();
    const file_path = path.join(DATA_DIR, AppData.PendingBootLogsFile);
    const claimed_path = `${file_path}.${process.pid}`;

    try {
        fs.renameSync(file_path, claimed_path);
    } catch {
        return;
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(claimed_path, "utf-8"));
        const entries: LogEventParams[] = Array.isArray(parsed) ? parsed : [];

        for (const entry of entries) {
            await logEvent(entry);
        }
    } catch {
        // A broken file is dropped: these are only log entries.
    } finally {
        fs.rmSync(claimed_path, { force: true });
    }
}
