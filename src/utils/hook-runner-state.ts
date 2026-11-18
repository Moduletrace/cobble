import type { BotHookWithNames } from "@/src/types";
import relativeTime from "./relative-time";

type Params = {
    hook: BotHookWithNames;
    now?: number;
};

export type HookRunnerState = {
    /**
     * The hook has a runner (a command the app keeps running).
     */
    configured: boolean;
    running: boolean;
    /**
     * A few words for a list line: "up 3h", "down", or nothing when
     * there is no runner (the line names it: "runner up 3h").
     */
    note: string;
    /**
     * Why it isn't running, as the last check found it.
     */
    error?: string;
};

/**
 * How a hook's runner stands, from what the last check stored
 * (`syncHookRunners`, every 5 minutes): whether the app has one for it,
 * whether it was up and since when, and why it wasn't. A runner that
 * stops between checks reads as up until the next one.
 */
export default function hookRunnerState({ hook, now = Date.now() }: Params): HookRunnerState {
    if (!hook.runner_command) return { configured: false, running: false, note: "" };

    const error = hook.runner_last_error || undefined;
    const running = Boolean(hook.runner_pid) && !error;

    return {
        configured: true,
        running,
        note: running ? `up ${relativeTime({ at: Number(hook.runner_started_at) || now, now })}` : "down",
        error,
    };
}