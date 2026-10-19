import type { HarnessTool } from "../../types";

type Params = {
    tool: HarnessTool;
    /**
     * Absolute paths of the env files on the computer.
     */
    shell_path: string;
    json_path: string;
};

/**
 * Makes a computer tool run with the computer's envs. The sandbox's shells
 * don't read a profile, so bash commands source the env file first and
 * Python or JavaScript code loads the JSON one. The model never sees the
 * addition; other tools pass through.
 */
export default function withComputerEnv({
    tool,
    shell_path,
    json_path,
}: Params): HarnessTool {
    const shell_prefix = `[ -f ${shell_path} ] && . ${shell_path}; `;

    if (tool.name == "sandbox_execute_bash") {
        return {
            ...tool,
            run: ({ args, signal }) =>
                tool.run({
                    args: typeof args?.cmd == "string" ? { ...args, cmd: `${shell_prefix}${args.cmd}` } : args,
                    signal,
                }),
        };
    }

    if (tool.name == "sandbox_execute_code") {
        return {
            ...tool,
            run: ({ args, signal }) =>
                tool.run({
                    args:
                        typeof args?.code == "string"
                            ? { ...args, code: `${codePrefix({ language: args.language, json_path })}${args.code}` }
                            : args,
                    signal,
                }),
        };
    }

    return tool;
}

function codePrefix({ language, json_path }: { language?: unknown; json_path: string }) {
    const path = JSON.stringify(json_path);
    const lang = typeof language == "string" ? language.toLowerCase() : "python";

    if (lang.startsWith("py")) {
        return `import json as _cobble_json, os as _cobble_os; _cobble_os.environ.update(_cobble_json.load(open(${path})) if _cobble_os.path.exists(${path}) else {})\n`;
    }

    if (lang.startsWith("js") || lang.startsWith("javascript") || lang.startsWith("node")) {
        return `try { Object.assign(process.env, JSON.parse(require("fs").readFileSync(${path}, "utf8"))); } catch {}\n`;
    }

    return "";
}
