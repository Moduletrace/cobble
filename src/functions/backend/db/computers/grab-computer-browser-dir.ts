import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";

type Params = {
    computer_id: number | string;
};

/**
 * Where a computer's browser profile is kept, as this app sees it:
 * `DATA_DIR/<AppData.ComputerBrowserDataDir>/<id>`.
 */
export default function grabComputerBrowserDir({ computer_id }: Params) {
    const { DATA_DIR } = grabDirNames();

    return path.join(DATA_DIR, AppData.ComputerBrowserDataDir, String(computer_id));
}
