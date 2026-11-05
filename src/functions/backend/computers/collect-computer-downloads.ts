import { AppData } from "@/src/data/app-data";
import parseCollectedDownloads from "@/src/utils/parse-collected-downloads";
import shellQuote from "@/src/utils/shell-quote";
import type { ComputerApi } from "./computer-fetch";
import runComputerCommand from "./run-computer-command";

type Params = {
    computer: ComputerApi;
    /**
     * The run's folder to move them into (made when needed).
     */
    dir: string;
    signal?: AbortSignal;
};

/**
 * Moves every finished download out of the browser's download folder
 * (`AppData.ComputerBrowserDownloadsDir`) into a run's folder, under its
 * own name, numbered (`1-name`, ...) when that's taken, and lists the ones
 * Chrome is still writing (`.crdownload`), which a later call picks up.
 */
export default async function collectComputerDownloads({ computer, dir, signal }: Params) {
    const command = [
        `src=${shellQuote({ text: AppData.ComputerBrowserDownloadsDir })}`,
        `dir=${shellQuote({ text: dir })}`,
        `[ -d "$src" ] || exit 0`,
        `for f in "$src"/* "$src"/.[!.]*; do`,
        `  [ -f "$f" ] || continue`,
        `  name=$(basename -- "$f")`,
        `  case "$name" in *.crdownload) printf 'pending\\t%s\\n' "\${name%.crdownload}"; continue;; esac`,
        `  mkdir -p "$dir" || exit 1`,
        `  to="$dir/$name"; n=1`,
        `  while [ -e "$to" ]; do to="$dir/$n-$name"; n=$((n+1)); done`,
        `  mv -- "$f" "$to" && printf 'moved\\t%s\\t%s\\n' "$name" "$to"`,
        `done`,
    ].join("\n");

    const { output } = await runComputerCommand({
        computer,
        command,
        timeout_ms: AppData.McpConnectTimeoutMs,
        signal,
    });

    return parseCollectedDownloads({ output });
}
