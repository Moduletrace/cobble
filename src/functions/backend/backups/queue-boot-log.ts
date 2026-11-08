import fs from "fs";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";
import type { LogEventParams } from "@/src/functions/backend/logger";

type Params = {
    entry: LogEventParams;
};

/**
 * Keeps a log entry for the next boot to write (`flushBootLogs`). For
 * what happens right before the app restarts onto a replaced database:
 * the process still has the old file open, so a `logEvent` now would
 * land in a file nothing reads again. Call it after the data is in place
 * (a whole-data restore empties `DATA_DIR` first).
 */
export default function queueBootLog({ entry }: Params) {
    const { DATA_DIR } = grabDirNames();
    const file_path = path.join(DATA_DIR, AppData.PendingBootLogsFile);

    let entries: LogEventParams[] = [];

    try {
        const parsed = JSON.parse(fs.readFileSync(file_path, "utf-8"));
        if (Array.isArray(parsed)) entries = parsed;
    } catch {
        // Nothing queued yet, or a broken file: start over.
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file_path, JSON.stringify([...entries, entry]));
}
