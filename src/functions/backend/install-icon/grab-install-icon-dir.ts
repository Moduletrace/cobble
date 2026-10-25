import path from "node:path";
import { PwaInstallIconDir } from "@/src/data/pwa-data";
import grabDirNames from "@/src/utils/grab-dir-names";

/**
 * `DATA_DIR/install-icon`: the stored upload (`source.png`) and one folder
 * per generated icon set.
 */
export default function grabInstallIconDir() {
    return path.join(grabDirNames().DATA_DIR, PwaInstallIconDir);
}
