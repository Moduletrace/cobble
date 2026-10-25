import AppError from "@/src/utils/app-error";
import { resolveComputerPath, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";

type Params = {
    tool: HarnessTool;
    dirs: ComputerRunDirs;
};

/**
 * Tools whose `path` argument names a file on the computer.
 */
const PathTools = ["sandbox_file_operations", "sandbox_str_replace_editor"];

/**
 * Tools that open a URL, which may be a `file:` one.
 */
const UrlTools: Record<string, string> = {
    browser_navigate: "url",
    browser_new_tab: "url",
    sandbox_convert_to_markdown: "uri",
};

/**
 * Keeps a computer tool in the run's folders (`computerRunDirs`): bash
 * runs in the user's folder with it as `HOME`, code starts there, a file
 * tool's path is resolved against it and refused outside the run's folders
 * (`resolveComputerPath`, its `sudo` too), and so is a `file:` URL. The
 * model gets a refusal back as the tool's error; nothing reaches the
 * computer. Other tools pass through.
 */
export default function withComputerDirs({ tool, dirs }: Params): HarnessTool {
    if (tool.name == "sandbox_execute_bash") {
        return {
            ...tool,
            run: async ({ args, signal }) => {
                const cwd = resolveComputerPath({ path: typeof args?.cwd == "string" ? args.cwd : "", dirs });

                return tool.run({
                    args: {
                        ...args,
                        cwd,
                        cmd: typeof args?.cmd == "string" ? `export HOME=${JSON.stringify(dirs.cwd)}; ${args.cmd}` : args?.cmd,
                    },
                    signal,
                });
            },
        };
    }

    if (tool.name == "sandbox_execute_code") {
        return {
            ...tool,
            run: async ({ args, signal }) =>
                tool.run({
                    args:
                        typeof args?.code == "string"
                            ? { ...args, code: `${codePrefix({ language: args.language, cwd: dirs.cwd })}${args.code}` }
                            : args,
                    signal,
                }),
        };
    }

    if (PathTools.includes(tool.name)) {
        return {
            ...tool,
            run: async ({ args, signal }) => {
                if (args?.sudo) throw new AppError(`sudo isn't available here: work in your own folders.`);

                return tool.run({
                    args: { ...args, path: resolveComputerPath({ path: args?.path, dirs }) },
                    signal,
                });
            },
        };
    }

    const url_key = UrlTools[tool.name];

    if (url_key) {
        return {
            ...tool,
            run: async ({ args, signal }) => {
                const url = typeof args?.[url_key] == "string" ? args[url_key].trim() : "";

                if (/^file:/i.test(url)) {
                    const file_path = decodeURIComponent(url.replace(/^file:(\/\/[^/]*)?/i, ""));

                    resolveComputerPath({ path: file_path.startsWith("/") ? file_path : `/${file_path}`, dirs });
                }

                return tool.run({ args, signal });
            },
        };
    }

    return tool;
}

function codePrefix({ language, cwd }: { language?: unknown; cwd: string }) {
    const dir = JSON.stringify(cwd);
    const lang = typeof language == "string" ? language.toLowerCase() : "python";

    if (lang.startsWith("py")) {
        return `import os as _cobble_os; _cobble_os.makedirs(${dir}, exist_ok=True); _cobble_os.chdir(${dir}); _cobble_os.environ["HOME"] = ${dir}\n`;
    }

    if (lang.startsWith("js") || lang.startsWith("javascript") || lang.startsWith("node")) {
        return `try { require("fs").mkdirSync(${dir}, { recursive: true }); process.chdir(${dir}); process.env.HOME = ${dir}; } catch {}\n`;
    }

    return "";
}
