import { AppData } from "@/src/data/app-data";

type Params = {
    scope?: string | null;
    owner_id?: number | string | null;
    path?: string | null;
};

/**
 * Where a bot file sits on the data volume: its folder (`bots/<id>` or
 * `workspaces/<id>`) and its path inside it, e.g. `bots/3/reports/q3.md`.
 */
export default function botFileFullPath({ scope, owner_id, path }: Params) {
    const dir = scope == "workspace" ? AppData.WorkspaceDataDir : AppData.BotDataDir;
    const inside = (path || "").replace(/^\/+/, "");

    return [dir, String(Number(owner_id) || 0), inside].filter(Boolean).join("/");
}
