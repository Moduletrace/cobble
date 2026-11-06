import AppError from "@/src/utils/app-error";
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
 * (`computerRunDirs`): a `file:` URL it opens must be inside them (a
 * worker opens none: the browser runs as the computer's user, which can't
 * reach its folders, and a page from them could show other bots' files;
 * it serves its pages on localhost instead), and the
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

            if (/^file:/i.test(url) && dirs.run_as) {
                throw new AppError(
                    `The browser can't open files from your folders. Serve the folder instead, in the background (nohup python3 -m http.server 8000 --bind 127.0.0.1 --directory <folder> > /tmp/serve.log 2>&1 &), open http://127.0.0.1:8000/<file>, and stop the server when you're done.`,
                );
            }

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
