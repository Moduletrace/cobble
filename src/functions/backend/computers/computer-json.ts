import computerFetch, { type ComputerApi } from "./computer-fetch";

type Params = {
    computer: ComputerApi;
    path: string;
    /**
     * A JSON body makes it a POST.
     */
    body?: Record<string, unknown>;
    timeout_ms: number;
    signal?: AbortSignal;
};

/**
 * One JSON call to a computer's agent. Returns its answer; throws with the
 * agent's own error when it refuses.
 */
export default async function computerJson<T = any>({ computer, path, body, timeout_ms, signal }: Params): Promise<T> {
    const res = await computerFetch({
        computer,
        path,
        init: body
            ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
            : { method: "GET" },
        timeout_ms,
        signal,
    });
    const json: any = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(`The computer refused ${path}: ${json?.error || res.status}`);

    return json as T;
}
