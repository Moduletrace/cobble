/**
 * A folder `prepareComputerDataDir` moved aside:
 * `<id><ComputerOldHomeSuffix><timestamp>` for a computer's home from
 * before only its workspace was mounted, or `<id>-<timestamp>` when a new
 * computer took a deleted one's id. The suffix decides which is which, so
 * it is read from `AppData.ComputerOldHomeSuffix` rather than written out.
 */

import { AppData } from "@/src/data/app-data";

const stem = AppData.ComputerOldHomeSuffix.replace(/-$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const OldHomeName = new RegExp(`^\\d+(?:${stem})?-\\d+$`);

type Params = {
    name: string;
};

/**
 * The timestamp a moved-aside folder's name holds, or null when the name
 * isn't one of them. Nothing is mounted from such a folder, so a name this
 * recognises is a folder nothing can read again.
 */
export default function oldComputerHomeName({ name }: Params) {
    if (!OldHomeName.test(name)) return null;

    const stamp = Number(name.slice(name.lastIndexOf("-") + 1));

    return Number.isFinite(stamp) && stamp > 0 ? stamp : null;
}