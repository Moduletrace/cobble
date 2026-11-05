import computerJson from "./computer-json";
import type { ComputerApi } from "./computer-fetch";

type Params = {
    computer: ComputerApi;
    command: string;
    /**
     * The command is stopped on the computer after this (whole seconds,
     * rounded up), with its whole process group.
     */
    timeout_ms: number;
    signal?: AbortSignal;
};

export type ComputerCommandResult = {
    output: string;
    exit_code: number | null;
    timed_out: boolean;
    truncated: boolean;
};

/**
 * Runs one bash command on a computer as its user (the agent's
 * `/api/exec`): a fresh `bash -c` from its home, no input, stdout and
 * stderr together. The agent stops it at the timeout, and when this call
 * is aborted (a stopped run), so nothing is left blocking the computer.
 * Throws when the computer can't be reached or refuses the command.
 */
export default async function runComputerCommand({ computer, command, timeout_ms, signal }: Params) {
    const result = await computerJson<Partial<ComputerCommandResult>>({
        computer,
        path: "/api/exec",
        body: { command, timeout_seconds: Math.max(1, Math.ceil(timeout_ms / 1000)) },
        /**
         * Room for the agent to stop it and answer.
         */
        timeout_ms: timeout_ms + 15_000,
        signal,
    });

    return {
        output: String(result.output ?? ""),
        exit_code: typeof result.exit_code == "number" ? result.exit_code : null,
        timed_out: Boolean(result.timed_out),
        truncated: Boolean(result.truncated),
    } satisfies ComputerCommandResult;
}
