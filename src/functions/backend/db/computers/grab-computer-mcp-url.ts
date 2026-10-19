import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CONTAINERS,
} from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import { AppData } from "@/src/data/app-data";
import { ComputerMcpPath } from "@/src/dict/computer-dict";
import grabEnv from "../envs/grab-env";

type Params = {
    computer_id: number | string;
};

type ComputerRow = Pick<BUN_SQLITE_COBBLE_COMPUTERS, "id" | "name" | "kind"> &
    Pick<BUN_SQLITE_COBBLE_CONTAINERS, "hostname" | "port" | "metadata">;

/**
 * Where a computer's MCP server answers. In order: the container's
 * `metadata.mcp_url`, `MAIN_COMPUTER_URL` for the main computer (an app
 * setting, `grabEnv`: for a server outside docker, e.g.
 * `http://localhost:8170`), else its docker hostname and port. `base_url`
 * is the same address without `/mcp`, for the sandbox's REST API. Null
 * when the computer has no container.
 */
export default async function grabComputerMcpUrl({ computer_id }: Params) {
    const row = (
        await BunSQLite.sql<ComputerRow>({
            sql: `SELECT co.id, co.name, co.kind, c.hostname, c.port, c.metadata
                FROM computers co JOIN containers c ON c.id = co.container_id
                WHERE co.id = ? LIMIT 1`,
            values: [computer_id],
        })
    ).payload?.[0];

    if (!row?.hostname) return null;

    const metadata = parseJobJson({ text: row.metadata }) || {};

    if (typeof metadata.mcp_url == "string" && metadata.mcp_url) {
        return {
            url: metadata.mcp_url,
            base_url: metadata.mcp_url.replace(/\/mcp\/?$/, ""),
            name: row.name || "",
        };
    }

    const main_override = row.kind == "main"
        ? (await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim()
        : undefined;

    const base = main_override
        ? main_override.replace(/\/+$/, "")
        : `http://${row.hostname}:${row.port || AppData.ComputerPort}`;

    return { url: `${base}${ComputerMcpPath}`, base_url: base, name: row.name || "" };
}
