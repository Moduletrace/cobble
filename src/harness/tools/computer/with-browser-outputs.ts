import path from "path";
import { AppData } from "@/src/data/app-data";
import collectComputerDownloads from "@/src/functions/backend/computers/collect-computer-downloads";
import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import browserOutputText from "@/src/utils/browser-output-text";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";
import browserRecoveryHint from "./browser-recovery-hint";
import { computerWorkspaceFullWarning } from "./computer-workspace-room";

type Params = {
    tool: HarnessTool;
    computer: ComputerApi;
    dirs: ComputerRunDirs;
};

/**
 * Keeps a browser tool's result inside the run's folders. Links to what
 * Playwright MCP saved in its own folder (`AppData.ComputerBrowserOutputDir`:
 * snapshots, console logs, screenshots), which no run may read, become the
 * tool that reads them (`browserOutputText`). Files the browser finished
 * downloading (`AppData.ComputerBrowserDownloadsDir`) are moved into the
 * run's `downloads` folder, so `import_file` and the shell reach them, and
 * the result says where; one still downloading is named, for a later call.
 *
 * A call that wrote into those folders (a screenshot saved by name, a
 * download) also says when the computer's workspace has passed its limit
 * (`computerWorkspaceFullWarning`): browser output is where most of a
 * computer's disk goes, and nothing refuses it on the way in.
 */
export default function withBrowserOutputs({ tool, computer, dirs }: Params): HarnessTool {
    const output_dir = AppData.ComputerBrowserOutputDir;
    const downloads_dir = path.posix.join(dirs.cwd, AppData.ComputerDownloadsFolder);

    return {
        ...tool,
        run: async ({ args, signal }) => {
            const output = await tool.run({ args, signal });
            const text = browserOutputText({ text: typeof output == "string" ? output : output.text, output_dir });
            const { moved, pending } = await collectComputerDownloads({ computer, dir: downloads_dir, run_as: dirs.run_as, signal }).catch(() => ({
                moved: [],
                pending: [],
            }));
            const lines = [
                ...moved.map(({ name, path }) => `- Downloaded file ${name} to "${path}"`),
                ...pending.map((name) => `- Still downloading ${name}: it will be moved to ${downloads_dir} after a later browser call`),
            ];
            const wrote =
                moved.length > 0 ||
                (typeof args.filename == "string" && Boolean(args.filename.trim()));
            const full = wrote
                ? await computerWorkspaceFullWarning({ computer, dirs, signal }).catch(() => null)
                : null;
            const parts = [lines.length ? `${text}\n### Downloads\n${lines.join("\n")}` : text];
            const hint = browserRecoveryHint({ name: tool.name, text });

            if (full) parts.push(full);
            if (hint) parts.push(hint);

            const next = parts.join("\n\n");

            return typeof output == "string" ? next : { ...output, text: next };
        },
    };
}
