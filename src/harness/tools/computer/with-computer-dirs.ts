import { resolveComputerPath, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";

type Params = {
    tool: HarnessTool;
    dirs: ComputerRunDirs;
};

/**
 * Browser tools that open a URL, which may be a `file:` one, and the
 * argument it's in.
 */
const UrlTools: Record<string, string> = {
    browser_navigate: "url",
    browser_tabs: "url",
};

/**
 * Keeps a computer's browser tool in the run's folders
 * (`computerRunDirs`): a `file:` URL it opens must be inside them, and the
 * files it reads (`paths`: uploads, drops) or writes (`filename`: a
 * screenshot, a snapshot, a log saved by name) are resolved there
 * (`resolveComputerPath`), relative ones landing in the run's own folder
 * rather than the browser's. The model gets a refusal back as the tool's
 * error; nothing reaches the computer.
 */
export default function withComputerDirs({ tool, dirs }: Params): HarnessTool {
    const url_key = UrlTools[tool.name];
    const resolve = (path: unknown) => resolveComputerPath({ path: String(path ?? ""), dirs });

    return {
        ...tool,
        run: async ({ args, signal }) => {
            const url = url_key && typeof args?.[url_key] == "string" ? args[url_key].trim() : "";

            if (/^file:/i.test(url)) {
                const file_path = decodeURIComponent(url.replace(/^file:(\/\/[^/]*)?/i, ""));

                resolve(file_path.startsWith("/") ? file_path : `/${file_path}`);
            }

            return tool.run({
                args: {
                    ...args,
                    ...(Array.isArray(args?.paths) ? { paths: args.paths.map(resolve) } : {}),
                    ...(typeof args?.filename == "string" && args.filename.trim() ? { filename: resolve(args.filename.trim()) } : {}),
                },
                signal,
            });
        },
    };
}
