import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import { HookRunnerProtocol, HookRunnerScript, HookRunnerVersion } from "@/src/data/hook-runner-script";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import writeComputerFile from "@/src/functions/backend/computers/write-computer-file";
import { logError } from "@/src/functions/backend/logger";
import composeComputerEnvFiles from "@/src/harness/tools/computer/compose-computer-env-files";
import type { HookRunnerSync } from "@/src/types";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import computerRunDirs from "@/src/utils/computer-work-dirs";
import hookRunnerDir, { hookRunnerBaseDir, hookRunnerFile } from "@/src/utils/hook-runner-paths";
import hookRunnerVersion from "@/src/utils/hook-runner-version";
import type { ComputerAddress } from "../computers/grab-computer-target";
import grabComputerTarget from "../computers/grab-computer-target";
import grabComputerEnvs from "../envs/grab-computer-envs";

type Params = {
    /**
     * Only this computer's hooks (a change just made to one of them); the
     * cron checks every computer.
     */
    computer_id?: number | string | null;
    /**
     * Stop and start this hook's runner even though nothing about it changed
     * (the Restart action).
     */
    restart_hook_id?: number | string | null;
    /**
     * Stop this hook's runner and start nothing: it's being deleted, and
     * once its row is gone no check would know to stop it.
     */
    stop_hook_id?: number | string | null;
};

type HookRow = {
    id: number;
    user_id: number;
    bot_id: number;
    workspace_id: number | null;
    bot_kind: string | null;
    enabled: number;
    title: string | null;
    computer_id: number | null;
    runner_command: string | null;
    runner_dir: string | null;
    runner_computer_id: number | null;
    runner_version: string | null;
    runner_pid: number | null;
    runner_started_at: number | null;
    runner_last_error: string | null;
};

type Group = {
    computer_id: number;
    bot_id: number;
    hooks: HookRow[];
};

/**
 * What the keep-alive script says about one runner: its pid while it runs,
 * when it started, and why it isn't running.
 */
type RunnerResult = {
    id: number;
    pid?: number | null;
    running?: boolean;
    started_at?: number | null;
    error?: string | null;
};

const RunnerQuery = `SELECT h.id, h.user_id, h.bot_id, h.workspace_id, h.enabled, h.title,
        h.computer_id, h.runner_command, h.runner_dir, h.runner_computer_id, h.runner_version,
        h.runner_pid, h.runner_started_at, h.runner_last_error, b.kind AS bot_kind
    FROM bot_hooks h JOIN bots b ON b.id = h.bot_id
    WHERE COALESCE(h.runner_computer_id, h.computer_id) IS NOT NULL
        AND ((h.runner_command IS NOT NULL AND h.runner_command != '') OR h.runner_pid IS NOT NULL OR h.runner_version IS NOT NULL)`;

/**
 * Keeps every hook's runner running: the process that calls the hook (a
 * bridge, a watcher), which nothing else would bring back after a computer
 * restarts. The only writer of a hook's runner state.
 *
 * Hooks are grouped by computer and bot (one account, one folder with one
 * keep-alive script), the script's `desired.json` is written with what
 * should run, and it starts, restarts and stops exactly that: a paused,
 * deleted or changed runner is stopped because it's no longer in the list.
 * Each hook's state lands on its row, so the hook says whether its runner
 * is up and why not. Never throws; run by the `sync-computers` cron (every
 * 5 minutes, and at boot, so runners come back after a restart) and after
 * any change to a hook's runner (unawaited).
 */
export default async function syncHookRunners({ computer_id, restart_hook_id, stop_hook_id }: Params = {}): Promise<HookRunnerSync> {
    const sync: HookRunnerSync = { ok: true, checked: 0, running: 0, started: 0, stopped: 0 };

    try {
        const hooks =
            (
                await BunSQLite.sql<HookRow>({
                    sql: `${RunnerQuery}${computer_id ? " AND COALESCE(h.runner_computer_id, h.computer_id) = ?" : ""}
                        ORDER BY h.id`,
                    values: computer_id ? [Number(computer_id)] : [],
                })
            ).payload || [];

        if (!hooks.length) return sync;

        const groups = new Map<string, Group>();

        for (const hook of hooks) {
            const group_key = `${Number(hook.runner_computer_id || hook.computer_id)}:${Number(hook.bot_id)}`;
            const group = groups.get(group_key) || {
                computer_id: Number(hook.runner_computer_id || hook.computer_id),
                bot_id: Number(hook.bot_id),
                hooks: [],
            };

            group.hooks.push(hook);
            groups.set(group_key, group);
        }

        const addresses = new Map<number, ComputerAddress | null>();

        for (const group of groups.values()) {
            if (!addresses.has(group.computer_id)) {
                addresses.set(group.computer_id, await grabComputerTarget({ computer_id: group.computer_id }).catch(() => null));
            }

            const address = addresses.get(group.computer_id);

            if (!address || address.ready !== true) {
                const error = address ? computerNotReadyMessage(address) : "The computer has no container.";

                for (const hook of group.hooks) {
                    await recordRunnerFailure({ hook, sync, error });
                }

                continue;
            }

            if (address.connection === "ssh") {
                const error = "The computer is an SSH server: hook runners require a Docker container.";

                for (const hook of group.hooks) {
                    await recordRunnerFailure({ hook, sync, error });
                }

                continue;
            }

            try {
                await runGroup({ group, computer: address, restart_hook_id, stop_hook_id, sync });
            } catch (error) {
                for (const hook of group.hooks) {
                    await recordRunnerFailure({
                        hook,
                        sync,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        }
    } catch (error) {
        sync.ok = false;
        sync.error = error instanceof Error ? error.message : String(error);
    }

    return sync;
}

async function runGroup({
    group,
    computer,
    restart_hook_id,
    stop_hook_id,
    sync,
}: {
    group: Group;
    computer: ComputerAddress & { ready: true };
    restart_hook_id?: number | string | null;
    stop_hook_id?: number | string | null;
    sync: HookRunnerSync;
}) {
    const first = group.hooks[0]!;
    const workspace_id = group.hooks.find((hook) => hook.workspace_id)?.workspace_id || null;
    const dirs = computerRunDirs({
        bot_id: group.bot_id,
        bot_kind: first.bot_kind,
        user_id: first.user_id,
        workspace_id,
    });
    const base = hookRunnerBaseDir({ dirs });
    const runners: { id: number; command: string; cwd: string; version: string }[] = [];
    const wanted = new Set<number>();

    for (const hook of group.hooks) {
        if (!hook.enabled || !hook.runner_command?.trim()) continue;
        if (stop_hook_id && Number(stop_hook_id) == Number(hook.id)) continue;

        try {
            const hook_dirs = computerRunDirs({
                bot_id: group.bot_id,
                bot_kind: hook.bot_kind,
                user_id: hook.user_id,
                workspace_id: hook.workspace_id,
            });
            const cwd = hookRunnerDir({ dirs: hook_dirs, runner_dir: hook.runner_dir });
            const envs = await grabComputerEnvs({
                computer_id: group.computer_id,
                bot_id: hook.bot_id,
                user_id: hook.user_id,
                workspace_id: hook.workspace_id,
            });
            const version = hookRunnerVersion({
                script_version: HookRunnerVersion,
                command: hook.runner_command,
                dir: cwd,
                computer_id: group.computer_id,
                workspace_id: hook.workspace_id,
                envs,
            });

            await writeComputerFile({
                computer,
                path: hookRunnerFile({ dirs: hook_dirs, file: `${hook.id}.env.json` }),
                content: composeComputerEnvFiles({ envs }).json,
                mode: 0o600,
                run_as: hook_dirs.run_as,
            });

            runners.push({ id: Number(hook.id), command: hook.runner_command, cwd, version });
            wanted.add(Number(hook.id));
        } catch (error) {
            await recordRunnerFailure({
                hook,
                sync,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    await writeComputerFile({
        computer,
        path: hookRunnerFile({ dirs, file: "ensure.py" }),
        content: HookRunnerScript,
        mode: 0o700,
        run_as: dirs.run_as,
    });

    await writeComputerFile({
        computer,
        path: hookRunnerFile({ dirs, file: "desired.json" }),
        content: JSON.stringify({
            protocol: HookRunnerProtocol,
            version: HookRunnerVersion,
            stop_ms: AppData.BotHookRunnerStopMs,
            log_max_bytes: AppData.BotHookRunnerLogMaxBytes,
            restart: restart_hook_id && wanted.has(Number(restart_hook_id)) ? [Number(restart_hook_id)] : [],
            runners,
        }),
        mode: 0o600,
        run_as: dirs.run_as,
    });

    const res = await runComputerCommand({
        computer,
        command: `python3 ${hookRunnerFile({ dirs, file: "ensure.py" })}`,
        timeout_ms: AppData.BotHookRunnerExecTimeoutMs,
        run_as: dirs.run_as,
    });
    const output = res.output.trim();
    const parsed = JSON.parse(output.split("\n").filter(Boolean).pop() || "{}") as {
        ok?: boolean;
        error?: string;
        runners?: RunnerResult[];
    };
    const results = new Map((parsed.runners || []).map((runner) => [Number(runner.id), runner]));

    for (const hook of group.hooks) {
        const id = Number(hook.id);

        if (!wanted.has(id)) {
            await clearRunnerState({ hook });
            continue;
        }

        sync.checked++;

        const result = results.get(id);

        if (!result) {
            await recordRunnerFailure({
                hook,
                sync,
                error: parsed.error || "The check said nothing about it.",
            });
            continue;
        }

        if (result.running && result.pid) {
            sync.running += 1;
            if (Number(result.started_at) != Number(hook.runner_started_at) || !hook.runner_pid) sync.started += 1;

            await BunSQLite.sql({
                sql: `UPDATE bot_hooks SET runner_pid = ?, runner_started_at = ?, runner_version = ?, runner_checked_at = ?, runner_last_error = NULL WHERE id = ?`,
                values: [
                    Number(result.pid),
                    Number(result.started_at) || Date.now(),
                    runners.find((runner) => runner.id == id)?.version || null,
                    Date.now(),
                    id,
                ],
            });
            continue;
        }

        await recordRunnerFailure({
            hook,
            sync,
            error: result.error || parsed.error || "It isn't running.",
        });
    }
}

/**
 * Stores why a runner isn't up and logs it once: a check that finds the
 * same fault again only moves its time, so a dead bridge doesn't write an
 * entry every five minutes.
 */
async function recordRunnerFailure({ hook, sync, error }: { hook: HookRow; sync: HookRunnerSync; error: string }) {
    const message = error.slice(0, AppData.BotHookRunnerErrorChars);

    if (hook.runner_pid) sync.stopped += 1;

    await BunSQLite.sql({
        sql: `UPDATE bot_hooks SET runner_pid = NULL, runner_started_at = NULL, runner_checked_at = ?, runner_last_error = ? WHERE id = ?`,
        values: [Date.now(), message, Number(hook.id)],
    });

    if (hook.runner_last_error == message) return;

    await logError({
        title: `"${hook.title || `Hook ${hook.id}`}" runner isn't running`,
        category: "hook",
        user_id: Number(hook.user_id),
        error: message,
        metadata: { hook_id: Number(hook.id), computer_id: Number(hook.runner_computer_id || hook.computer_id) },
    }).catch(() => {});
}

async function clearRunnerState({ hook }: { hook: HookRow }) {
    if (!hook.runner_pid && !hook.runner_version && !hook.runner_last_error) return;

    await BunSQLite.sql({
        sql: `UPDATE bot_hooks SET runner_pid = NULL, runner_started_at = NULL, runner_version = NULL, runner_checked_at = ?, runner_last_error = NULL WHERE id = ?`,
        values: [Date.now(), Number(hook.id)],
    });
}