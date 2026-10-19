import fs from "fs/promises";
import { AppData } from "@/src/data/app-data";
import grabComputerDataDir from "./grab-computer-data-dir";

type Params = {
    computer_id: number | string;
    /**
     * A new computer: files already at its path (left by a deleted
     * computer with the same id, e.g. after a restore) are moved aside to
     * `<id>-<timestamp>` and kept, so it starts empty.
     */
    fresh?: boolean;
};

/**
 * Creates a computer's home directory, owned by the sandbox's user so it
 * can write there, and returns its path. Docker would otherwise create a
 * missing mount source owned by root.
 */
export default async function prepareComputerDataDir({ computer_id, fresh }: Params) {
    const dir = grabComputerDataDir({ computer_id });

    if (fresh) {
        const existing = await fs.readdir(dir).catch(() => null);

        if (existing?.length) {
            await fs.rename(dir, `${dir}-${Date.now()}`);
        }
    }

    await fs.mkdir(dir, { recursive: true });

    /**
     * Only root can hand a directory to another user; a dev server
     * running as that user already owns it.
     */
    await fs.chown(dir, AppData.ComputerUserUid, AppData.ComputerUserGid).catch(() => {});

    return dir;
}
