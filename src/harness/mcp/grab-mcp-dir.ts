import { mkdir } from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";

type Params = {
    server_id: number | string;
};

/**
 * Where a stdio MCP server runs and its setup installs:
 * `DATA_DIR/<AppData.McpDataDir>/<id>`, created when missing. On the data
 * volume in production, so installs survive app updates.
 */
export default async function grabMcpDir({ server_id }: Params) {
    const { DATA_DIR } = grabDirNames();
    const dir = path.join(DATA_DIR, AppData.McpDataDir, String(server_id));

    await mkdir(dir, { recursive: true });

    return dir;
}
