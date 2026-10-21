import { mkdirSync } from "node:fs";
import path from "node:path";
import { AppData } from "@/src/data/app-data";
import type { BotFileScope } from "@/src/dict/bot-file-dict";
import grabDirNames from "@/src/utils/grab-dir-names";

type Params = {
    scope: BotFileScope;
    /**
     * The bot id (scope bot) or workspace id (scope workspace).
     */
    owner_id: number | string;
    /**
     * Create it when it's missing (the directories are made on demand, so
     * an install from before this has no backfill to do).
     */
    create?: boolean;
};

/**
 * A storage directory on the data volume: `DATA_DIR/bots/<id>` for a bot,
 * `DATA_DIR/workspaces/<id>` for a workspace. Files never live on a
 * computer, so they survive one being rebuilt.
 */
export default function grabStorageDir({ scope, owner_id, create = true }: Params) {
    const { DATA_DIR } = grabDirNames();
    const folder = scope == "workspace" ? AppData.WorkspaceDataDir : AppData.BotDataDir;
    const dir = path.join(DATA_DIR, folder, String(owner_id));

    if (create) mkdirSync(dir, { recursive: true });

    return dir;
}
