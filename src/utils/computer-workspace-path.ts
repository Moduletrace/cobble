import { AppData } from "@/src/data/app-data";

/**
 * The real place of an absolute path on a computer, inside its mounted
 * workspace (`AppData.ComputerWorkspaceDir`). A worker sees its folders
 * through its home: `/home/cb-<bot>/workspace` is a link to `bots/<bot>`,
 * and `workspaces/<id>` inside that a link to the workspace's shared
 * `workspaces/<id>`, so both spellings (and the shared folder reached
 * through the bot's link) come out as the one real path. Anything else is
 * returned normalized, as it is.
 */
export default function computerWorkspacePath({ absolute }: { absolute: string }) {
    const workspace = AppData.ComputerWorkspaceDir;
    const normal = normalizeAbsolute({ absolute });
    const home = normal.match(/^\/home\/cb-(\d+)\/workspace(\/.*)?$/);
    const real = home ? `${workspace}/bots/${Number(home[1])}${home[2] || ""}` : normal;
    const shared = real.match(new RegExp(`^${escapeRegExp(workspace)}/bots/\\d+/workspaces/(\\d+)(/.*)?$`));

    return shared ? `${workspace}/workspaces/${Number(shared[1])}${shared[2] || ""}` : real;
}

/**
 * `path.posix.normalize` for an absolute path, without `node:path` (folder
 * refs read this in the browser): `.` and `..` resolved, slashes merged,
 * no trailing one.
 */
function normalizeAbsolute({ absolute }: { absolute: string }) {
    const segments: string[] = [];

    for (const segment of absolute.split("/")) {
        if (!segment || segment == ".") continue;

        if (segment == "..") segments.pop();
        else segments.push(segment);
    }

    return `/${segments.join("/")}`;
}

function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
