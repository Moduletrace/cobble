import path from "node:path";
import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import computerWorkerAccount from "@/src/utils/computer-worker-account";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import shellQuote from "@/src/utils/shell-quote";
import type { HarnessTool } from "../../types";

type Params = {
    tool: HarnessTool;
    computer: ComputerApi;
    dirs: ComputerRunDirs;
};

/**
 * A worker's browser tool calls that read or write its files (`paths`:
 * uploads; `filename`: a screenshot, a PDF, a log saved by name). Chrome
 * and Playwright MCP run as the computer's user, which can't open a
 * worker's folders (and mustn't: a link the worker left there could lead
 * anywhere), so the files pass through a folder of its own for the call
 * (`/tmp/cobble-browser-*`, open to that worker alone): the worker's own
 * account copies the inputs in and the output out, and its permissions
 * decide what it may read and where it may write. Paths arrive already
 * kept in its folders (`withComputerDirs`). The coordinator's calls, and
 * calls without files, pass straight through.
 */
export default function withWorkerBrowserFiles({ tool, computer, dirs }: Params): HarnessTool {
    if (!dirs.run_as) return tool;

    const who = computerWorkerAccount({ bot_id: dirs.run_as.bot_id }).name;

    return {
        ...tool,
        run: async ({ args, signal }) => {
            const inputs: string[] = Array.isArray(args?.paths) ? args.paths.map(String) : [];
            const output = typeof args?.filename == "string" && args.filename.trim() ? args.filename.trim() : "";

            if (!inputs.length && !output) return tool.run({ args, signal });

            const stage = await openStage({ computer, who, inputs, signal });

            try {
                const staged_output = output ? `${stage.dir}/out-${path.posix.basename(output)}` : "";
                const result = await tool.run({
                    args: {
                        ...args,
                        ...(inputs.length ? { paths: stage.inputs } : {}),
                        ...(output ? { filename: staged_output } : {}),
                    },
                    signal,
                });

                if (output) await deliverOutput({ computer, who, from: staged_output, to: output, signal });

                const swaps: [string, string][] = [
                    ...(output ? [[staged_output, output] as [string, string]] : []),
                    ...stage.inputs.map((staged, i) => [staged, inputs[i]!] as [string, string]),
                ];
                const restore = (text: string) => swaps.reduce((acc, [from, to]) => acc.replaceAll(from, to), text);

                return typeof result == "string" ? restore(result) : { ...result, text: restore(result.text) };
            } finally {
                runComputerCommand({
                    computer,
                    command: `rm -rf -- ${shellQuote({ text: stage.dir })}`,
                    timeout_ms: 30_000,
                }).catch(() => undefined);
            }
        },
    };
}

/**
 * Makes the call's folder (the computer's user's, with an ACL for the
 * worker) and has the worker copy each input into it. Throws when one
 * can't be read as the worker.
 */
async function openStage({ computer, who, inputs, signal }: { computer: ComputerApi; who: string; inputs: string[]; signal?: AbortSignal }) {
    const copy = `umask 022; cp -- "$1" "$2"`;
    const command = [
        `s=$(mktemp -d /tmp/cobble-browser-XXXXXX) || exit 1`,
        `setfacl -m ${shellQuote({ text: `u:${who}:rwx` })} "$s" || { rm -rf -- "$s"; exit 1; }`,
        `printf 'DIR:%s\\n' "$s"`,
        ...inputs.map((input, i) => {
            const to = `"$s"/${shellQuote({ text: `${i}-${path.posix.basename(input)}` })}`;

            return `if sudo -n -u ${shellQuote({ text: who })} -- bash -c ${shellQuote({ text: copy })} _ ${shellQuote({ text: input })} ${to} 2>/dev/null; then printf 'IN:%s\\n' ${to}; else printf 'MISSING:${i}\\n'; fi`;
        }),
    ].join("\n");

    const { output } = await runComputerCommand({ computer, command, timeout_ms: AppData.McpConnectTimeoutMs, signal });
    const dir = output.match(/^DIR:(\/tmp\/cobble-browser-[^\n]+)$/m)?.[1]?.trim();

    if (!dir) throw new Error(`The computer couldn't make a folder for the browser's files.`);

    const staged = [...output.matchAll(/^IN:(.+)$/gm)].map((match) => match[1]!.trim());
    const missing = [...output.matchAll(/^MISSING:(\d+)$/gm)].map((match) => inputs[Number(match[1])]!);

    if (missing.length || staged.length != inputs.length) {
        runComputerCommand({ computer, command: `rm -rf -- ${shellQuote({ text: dir })}`, timeout_ms: 30_000 }).catch(() => undefined);

        throw new AppError(`Couldn't read ${missing.join(", ") || "the files"} as your account: check they exist in your folders.`);
    }

    return { dir, inputs: staged };
}

/**
 * Has the worker copy what the browser wrote into the path it asked for
 * (its folders), so it's the worker's file. Nothing written: nothing to do.
 */
async function deliverOutput({ computer, who, from, to, signal }: { computer: ComputerApi; who: string; from: string; to: string; signal?: AbortSignal }) {
    const copy = `umask 007; mkdir -p -- "$(dirname -- "$2")" && cp -- "$1" "$2"`;
    const result = await runComputerCommand({
        computer,
        command: [
            `f=${shellQuote({ text: from })}`,
            `[ -f "$f" ] || exit 0`,
            `setfacl -m ${shellQuote({ text: `u:${who}:r` })} "$f" || exit 1`,
            `sudo -n -u ${shellQuote({ text: who })} -- bash -c ${shellQuote({ text: copy })} _ "$f" ${shellQuote({ text: to })}`,
        ].join("\n"),
        timeout_ms: AppData.McpConnectTimeoutMs,
        signal,
    });

    if (result.exit_code) throw new AppError(`The browser saved it, but it couldn't be put at ${to}: ${result.output.trim() || "permission denied"}.`);
}
