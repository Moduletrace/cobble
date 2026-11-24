import type { SshTarget } from "../db/computers/grab-computer-target";

/**
 * A computer's agent: its address and the token it asks for
 * (`computerToken`). `grabComputerMcpUrl`'s ready answer is one.
 * Or an SSH target.
 */
export type ComputerApi =
    | { connection?: "docker"; base_url: string; token: string }
    | { connection: "ssh"; ssh: SshTarget; computer_id?: number };

type Params = {
    computer: ComputerApi;
    /**
     * From the agent's root, e.g. `/api/exec`.
     */
    path: string;
    init?: RequestInit;
    /**
     * Give up after this long; `null` or 0 waits for the caller's own
     * signal alone.
     */
    timeout_ms: number | null;
    signal?: AbortSignal;
};

/**
 * One request to a computer's agent, with its token. Returns the response
 * as it is; throws when the computer can't be reached in time.
 */
export default function computerFetch({ computer, path, init = {}, timeout_ms, signal }: Params) {
    if (computer.connection === "ssh") {
        throw new Error("computerFetch cannot be used on an SSH computer (docker-only)");
    }

    const headers = new Headers(init.headers);
    const signals = [
        ...(signal ? [signal] : []),
        ...(timeout_ms != null && timeout_ms > 0 ? [AbortSignal.timeout(timeout_ms)] : []),
    ];

    headers.set("authorization", `Bearer ${computer.token}`);

    return fetch(`${computer.base_url}${path}`, {
        ...init,
        headers,
        ...(signals.length ? { signal: AbortSignal.any(signals) } : {}),
    });
}
