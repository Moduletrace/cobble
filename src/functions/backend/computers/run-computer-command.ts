import type { ComputerRunAs } from "@/src/utils/computer-work-dirs";
import computerJson from "./computer-json";
import type { ComputerApi } from "./computer-fetch";

type Params = {
    computer: ComputerApi;
    command: string;
    /**
     * The command is stopped on the computer after this (whole seconds,
     * rounded up), with its whole process group; `null` leaves it no time
     * limit, so it runs until it ends or the call is aborted.
     */
    timeout_ms: number | null;
    /**
     * A worker's own account to run it as (`ComputerRunDirs.run_as`);
     * without it, the computer's user (gem, with sudo).
     */
    run_as?: ComputerRunAs | null;
    signal?: AbortSignal;
};

export type ComputerCommandResult = {
    output: string;
    exit_code: number | null;
    timed_out: boolean;
    truncated: boolean;
};

/**
 * The client's own ceiling for a call with no deadline: `AbortSignal.timeout`
 * needs a number, and twenty days is past any command a run would wait on
 * while staying under its maximum. The command's own limit, the run's Stop
 * and the computer's connection are what really end it; the agent keeps the
 * answer alive with a heartbeat while it runs, so a client that drops a
 * silent connection (Bun's fetch does, after about six minutes) never cuts
 * a long command.
 */
const NoDeadlineFetchMs = 20 * 24 * 60 * 60 * 1000;

/**
 * Runs one bash command on a computer as its user, or as a worker's own
 * account (`run_as`) (the agent's `/api/exec`): a fresh `bash -c` from its home, no input, stdout and
 * stderr together. The agent stops it at the timeout, and when this call
 * is aborted (a stopped run), so nothing is left blocking the computer.
 * Throws when the computer can't be reached or refuses the command.
 */
export default async function runComputerCommand({ computer, command, timeout_ms, run_as, signal }: Params) {
    const result = await computerJson<Partial<ComputerCommandResult>>({
        computer,
        path: "/api/exec",
        body: {
            command,
            ...(timeout_ms == null ? {} : { timeout_seconds: Math.max(1, Math.ceil(timeout_ms / 1000)) }),
            ...(run_as ? { run_as } : {}),
        },
        /**
         * Room for the agent to stop it and answer.
         */
        timeout_ms: timeout_ms == null ? NoDeadlineFetchMs : timeout_ms + 15_000,
        signal,
    });

    return {
        output: String(result.output ?? ""),
        exit_code: typeof result.exit_code == "number" ? result.exit_code : null,
        timed_out: Boolean(result.timed_out),
        truncated: Boolean(result.truncated),
    } satisfies ComputerCommandResult;
}
