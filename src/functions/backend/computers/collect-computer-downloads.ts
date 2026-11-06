import { AppData } from "@/src/data/app-data";
import parseCollectedDownloads from "@/src/utils/parse-collected-downloads";
import computerWorkerAccount from "@/src/utils/computer-worker-account";
import type { ComputerRunAs } from "@/src/utils/computer-work-dirs";
import shellQuote from "@/src/utils/shell-quote";
import type { ComputerApi } from "./computer-fetch";
import runComputerCommand from "./run-computer-command";

type Params = {
    computer: ComputerApi;
    /**
     * The run's folder to move them into (made when needed).
     */
    dir: string;
    /**
     * A worker's run: the copy into its folder is made by its own account.
     */
    run_as?: ComputerRunAs | null;
    signal?: AbortSignal;
};

/**
 * Moves every finished download out of the browser's download folder
 * (`AppData.ComputerBrowserDownloadsDir`, the computer's user's) into a
 * run's folder, under its own name, numbered (`1-name`, ...) when that's
 * taken, and lists the ones Chrome is still writing (`.crdownload`), which
 * a later call picks up. For a worker, the computer's user lets its
 * account read just that file (an ACL), and the account copies it in
 * itself (`sudo -u`), so a link it left in its folder can only lead where
 * it may write anyway; the original is removed once it's copied.
 */
export default async function collectComputerDownloads({ computer, dir, run_as, signal }: Params) {
    const who = run_as ? computerWorkerAccount({ bot_id: run_as.bot_id }).name : "";
    /**
     * Run by the account that keeps the file: makes the folder, picks a
     * free name, copies, prints where.
     */
    const place = [
        `d=$1; n=$2; f=$3`,
        `mkdir -p "$d" || exit 1`,
        `to="$d/$n"; i=1`,
        `while [ -e "$to" ] || [ -L "$to" ]; do to="$d/$i-$n"; i=$((i+1)); done`,
        `cp -- "$f" "$to" && printf '%s' "$to"`,
    ].join("; ");

    const command = [
        `src=${shellQuote({ text: AppData.ComputerBrowserDownloadsDir })}`,
        `dir=${shellQuote({ text: dir })}`,
        `who=${shellQuote({ text: who })}`,
        `place=${shellQuote({ text: place })}`,
        `[ -d "$src" ] || exit 0`,
        `for f in "$src"/* "$src"/.[!.]*; do`,
        `  [ -f "$f" ] || continue`,
        `  name=$(basename -- "$f")`,
        `  case "$name" in *.crdownload) printf 'pending\\t%s\\n' "\${name%.crdownload}"; continue;; esac`,
        `  if [ -n "$who" ]; then`,
        `    setfacl -m "u:$who:x" "$src" && setfacl -m "u:$who:r" "$f" || continue`,
        `    to=$(sudo -n -u "$who" -- bash -c "umask 007; $place" _ "$dir" "$name" "$f") || continue`,
        `  else`,
        `    to=$(bash -c "$place" _ "$dir" "$name" "$f") || continue`,
        `  fi`,
        `  rm -f -- "$f" && printf 'moved\\t%s\\t%s\\n' "$name" "$to"`,
        `done`,
        `[ -z "$who" ] || setfacl -x "u:$who" "$src" 2>/dev/null`,
        `true`,
    ].join("\n");

    const { output } = await runComputerCommand({
        computer,
        command,
        timeout_ms: AppData.McpConnectTimeoutMs,
        signal,
    });

    return parseCollectedDownloads({ output });
}
