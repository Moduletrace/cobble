import path from "node:path";
import { AppData } from "@/src/data/app-data";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import grabComputerHostDirectories from "@/src/functions/backend/db/host-directories/grab-computer-host-directories";
import grabDeleteApproval from "@/src/functions/backend/db/host-directories/grab-delete-approval";
import { computerRunPath } from "@/src/utils/computer-work-dirs";
import computerWorkspacePath from "@/src/utils/computer-workspace-path";
import gatedMountFor from "@/src/utils/host-directory-gated-target";
import hostDirectoryDeletePaths, { type HostDirectoryDeleteTarget } from "@/src/utils/host-directory-delete-paths";
import shellQuote from "@/src/utils/shell-quote";
import type { ComputerToolContext } from "./computer-tool-context";

/**
 * Holds a `computer_bash` command that would delete something inside a
 * folder mounted from the host machine until the user approves it, and
 * keeps a copy of what it removes.
 *
 * Deleting on the host can't be undone, and the folder is the user's own
 * data, not the bot's: the account may unlink there, so the app is the
 * only place a confirmation can sit. It is a heuristic at the tool's edge
 * (`hostDirectoryDeletePaths` reads the plain spellings); a script the bot
 * writes and runs still removes what its account may, which is why the
 * folder is mounted from a copy of it when that matters. The copy is only
 * taken once the user approved, in the bot's own folder, so it is theirs
 * to clear.
 */

export type HostDirectoryDeleteGuard = {
    /** What the bot is told instead of running the command. */
    blocked?: string;
    /** A line to put in front of the result, when the command ran. */
    note?: string;
};

type Gate = {
    host_directory_id: number;
    name: string;
    /** The mount's path on the computer, as the run sees it. */
    run_target: string;
    /** The same path in the computer's own spelling (what the mount is on). */
    real_target: string;
};

type Params = {
    command: string;
    cwd: string | null;
    context: ComputerToolContext;
    signal?: AbortSignal;
};

export default async function hostDirectoryDeleteGuard({ command, cwd, context, signal }: Params): Promise<HostDirectoryDeleteGuard | null> {
    const { dirs, computer, session_id, computer_id, bot_id, workspace_id } = context;
    const start = cwd || dirs.cwd;
    const targets = hostDirectoryDeletePaths({ command, cwd: start });

    if (!targets.length) return null;

    const gates = await grabGates({ computer_id, bot_id, workspace_id, dirs });
    const hits = targets
        .map((target) => ({ target, gate: gatedMountFor({ target, mounts: gates }) }))
        .filter((hit): hit is { target: HostDirectoryDeleteTarget; gate: Gate } => Boolean(hit.gate));

    if (!hits.length) return null;

    const approved = await grabDeleteApproval({
        session_id,
        needles: hits.flatMap((hit) => [hit.target.path, computerWorkspacePath({ absolute: hit.target.path }), hit.gate.real_target]),
    });

    if (!approved) return { blocked: approvalNote({ hits }) };

    return keepCopies({ hits, context, signal });
}

/**
 * The folder's mounts the run may delete in: its own computer link and the
 * links of the workspace it is in (a coordinator reaches every folder on
 * the computer, so every mount there), read-write and with the gate on.
 */
async function grabGates({
    computer_id,
    bot_id,
    workspace_id,
    dirs,
}: {
    computer_id: number;
    bot_id: number;
    workspace_id: number | null;
    dirs: ComputerToolContext["dirs"];
}): Promise<Gate[]> {
    const { links, mounts } = await grabComputerHostDirectories({ computer_id });

    const linkFor = (mount: (typeof mounts)[number]) =>
        links.find(
            (link) =>
                link.host_directory_id == mount.host_directory_id &&
                link.scope == mount.scope &&
                (mount.scope == "computer" || Number(link.workspace_id) == Number(mount.workspace_id)),
        );

    const gates: Gate[] = [];

    for (const mount of mounts) {
        const link = linkFor(mount);

        if (!link || !link.gate_deletes || link.access != "read-write") continue;

        /**
         * A worker reaches its own computer link and the links of the
         * workspace it is in. The coordinator reaches every folder on the
         * computer, so every mount counts (a host folder is never the one
         * it is working in on its own).
         */
        if (dirs.run_as) {
            if (mount.scope == "computer" && Number(mount.bot_id) != Number(bot_id)) continue;
            if (mount.scope == "workspace" && Number(mount.workspace_id) != Number(workspace_id)) continue;
        }

        gates.push({
            host_directory_id: link.host_directory_id,
            name: link.name,
            real_target: mount.target,
            run_target: computerRunPath({ real: mount.target, dirs }),
        });
    }

    return gates;
}

function approvalNote({ hits }: { hits: { target: HostDirectoryDeleteTarget; gate: Gate }[] }) {
    const names = [...new Set(hits.map((hit) => hit.gate.name))];
    const paths = [...new Set(hits.map((hit) => hit.target.path))];

    return [
        `Nothing ran: deleting in ${names.join(", ")}, a folder on the host machine, needs the user's approval first, and what is removed there can't be undone.`,
        `Ask them with ask_user: one question that names the exact path (${paths.map((item) => `\`${item}\``).join(", ")}) and what would be removed, with the options "Delete it" and "Keep it".`,
        `When they pick "Delete it", their message carries the path back, and you can run the same command again: the app then keeps a copy of what it removes in your own folder.`,
        `If this run can't ask (a routine, a hook call or a request from another bot), say so in your report and leave the folder as it is.`,
    ].join(" ");
}

/**
 * Copies the paths an approved delete names into the run's own folder, so
 * the user can get them back. Past `HostDirectoryRecoverMaxBytes` a path is
 * left out and the result says the delete went ahead without a copy.
 */
async function keepCopies({
    hits,
    context,
    signal,
}: {
    hits: { target: HostDirectoryDeleteTarget; gate: Gate }[];
    context: ComputerToolContext;
    signal?: AbortSignal;
}): Promise<HostDirectoryDeleteGuard> {
    const { computer, dirs } = context;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const folder = path.posix.join(dirs.bot_dir, AppData.HostDirectoryRecoverFolder, stamp);
    const copied: string[] = [];
    const too_big: string[] = [];

    for (const [index, hit] of hits.entries()) {
        if (!(await exists({ context, target: hit.target.path, signal }))) continue;

        const bytes = await measure({ context, target: hit.target.path, signal });

        if (bytes != null && bytes > AppData.HostDirectoryRecoverMaxBytes) {
            too_big.push(hit.target.path);
            continue;
        }

        const name = path.posix.basename(hit.target.path) || "path";
        const destination = path.posix.join(folder, `${index + 1}-${name}`);
        const result = await runComputerCommand({
            computer,
            command: `mkdir -p ${shellQuote({ text: folder })} && cp -a -- ${shellQuote({ text: hit.target.path })} ${shellQuote({ text: destination })}`,
            timeout_ms: AppData.HostDirectoryRecoverTimeoutMs,
            run_as: dirs.run_as,
            signal,
        });

        if (result.exit_code != 0) {
            return {
                blocked: `Nothing was deleted: the app couldn't keep a copy of ${hit.target.path} first (exit code ${result.exit_code ?? "unknown"}). Check that the path still exists and has room, or ask the user to remove it themselves.`,
            };
        }

        copied.push(hit.target.path);
    }

    const lines = [
        copied.length ? `A copy of ${copied.join(", ")} was kept in ${folder} before this delete.` : "",
        too_big.length
            ? `${too_big.join(", ")} was too large to copy (over ${Math.round(AppData.HostDirectoryRecoverMaxBytes / (1024 * 1024))} MB), so it was deleted with no copy kept.`
            : "",
    ].filter(Boolean);

    return lines.length ? { note: `[${lines.join(" ")}]` } : {};
}

/**
 * Whether the path is still on the computer: a delete of something already
 * gone removes nothing, so it needs no copy and no approval held up by it.
 */
async function exists({ context, target, signal }: { context: ComputerToolContext; target: string; signal?: AbortSignal }) {
    const result = await runComputerCommand({
        computer: context.computer,
        command: `test -e ${shellQuote({ text: target })}`,
        timeout_ms: 30_000,
        run_as: context.dirs.run_as,
        signal,
    }).catch(() => null);

    return result?.exit_code == 0;
}

/**
 * How big a path is on the computer, or null when it can't be read.
 */
async function measure({ context, target, signal }: { context: ComputerToolContext; target: string; signal?: AbortSignal }) {
    const result = await runComputerCommand({
        computer: context.computer,
        command: `du -sb -- ${shellQuote({ text: target })} 2>/dev/null | cut -f1`,
        timeout_ms: 30_000,
        run_as: context.dirs.run_as,
        signal,
    }).catch(() => null);
    const bytes = Number(String(result?.output || "").trim());

    return Number.isFinite(bytes) && bytes >= 0 ? bytes : null;
}