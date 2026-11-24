import { AppData } from "@/src/data/app-data";

/**
 * How long a `computer_bash` call may run. A bot's own `timeout` wins, or
 * `"unlimited"` when it knows the work is long; a limit the install set
 * (`AppData.ComputerCommandMaxSeconds`, 0 for none) caps either. Nobody
 * named anything: the install's limit, else the default, so a command that
 * waits on a prompt that never comes can't hang the run.
 */
export default function commandTimeoutSeconds({ asked, max }: { asked?: number | "unlimited"; max: number }): number | null {
    if (asked === "unlimited") return max > 0 ? max : null;

    const asked_seconds = typeof asked === "number" ? Math.max(1, Math.ceil(asked)) : null;

    if (max > 0) return asked_seconds == null ? max : Math.min(max, asked_seconds);

    return asked_seconds ?? AppData.ComputerCommandDefaultSeconds;
}