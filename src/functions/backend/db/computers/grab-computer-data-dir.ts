import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";

type Params = {
    computer_id: number | string;
};

/**
 * Where a computer's home directory is kept, as this app sees it:
 * `DATA_DIR/<AppData.ComputerDataDir>/<id>`.
 */
export default function grabComputerDataDir({ computer_id }: Params) {
    const { DATA_DIR } = grabDirNames();

    return path.join(DATA_DIR, AppData.ComputerDataDir, String(computer_id));
}
