/**
 * A computer's agent: its address and the token it asks for
 * (`computerToken`). `grabComputerMcpUrl`'s ready answer is one.
 */
export type ComputerApi = {
    base_url: string;
    token: string;
};

type Params = {
    computer: ComputerApi;
    /**
     * From the agent's root, e.g. `/api/exec`.
     */
    path: string;
    init?: RequestInit;
    timeout_ms: number;
    signal?: AbortSignal;
};

/**
 * One request to a computer's agent, with its token. Returns the response
 * as it is; throws when the computer can't be reached in time.
 */
export default function computerFetch({ computer, path, init = {}, timeout_ms, signal }: Params) {
    const headers = new Headers(init.headers);

    headers.set("authorization", `Bearer ${computer.token}`);

    return fetch(`${computer.base_url}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(timeout_ms)]),
    });
}
