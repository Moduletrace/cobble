import path from "node:path";
import grabDirNames from "./grab-dir-names";
import { isInsideRoot } from "./resolve-bot-path";

type Params = {
    absolute: string;
    /**
     * The data directory, else `DATA_DIR` (tests pass their own).
     */
    data_dir?: string;
};

/**
 * How the file preview names a file on disk: its path on the data volume
 * (`computers/2/bots/5/notes.md`), the way bots' and media rows' paths
 * read, or the absolute path when it lives elsewhere (a computer whose
 * home was mounted from outside the data directory).
 */
export default function dataVolumePath({ absolute, data_dir }: Params) {
    const root = path.resolve(data_dir || grabDirNames().DATA_DIR);
    const resolved = path.resolve(absolute);

    if (resolved == root || !isInsideRoot({ root, absolute: resolved })) return resolved;

    return path.relative(root, resolved).split(path.sep).join("/");
}
