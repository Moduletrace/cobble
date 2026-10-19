import { AppData } from "@/src/data/app-data";

type Params = {
    method?: "GET" | "POST" | "DELETE";
    /**
     * Docker engine API path, e.g. `/containers/json`.
     */
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    timeout_ms?: number;
};

export type DockerResponse<T> = {
    status: number;
    ok: boolean;
    data: T | null;
    /**
     * The engine's own message when the call failed.
     */
    message?: string;
};

/**
 * One call to the docker engine API over its unix socket
 * (`AppData.DockerSocketPath`, or `DOCKER_SOCKET` in the process env).
 * Never throws for an HTTP error; check `ok`. Throws when the engine
 * can't be reached at all.
 */
export default async function dockerRequest<T = unknown>({
    method = "GET",
    path,
    query,
    body,
    timeout_ms = 60 * 1000,
}: Params): Promise<DockerResponse<T>> {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(query || {})) {
        if (value !== undefined) search.set(key, String(value));
    }

    const url = `http://docker${path}${search.size ? `?${search}` : ""}`;

    const res = await fetch(url, {
        method,
        unix: process.env.DOCKER_SOCKET || AppData.DockerSocketPath,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeout_ms),
    }).catch((error) => {
        throw new Error(
            `Can't reach docker: ${error instanceof Error ? error.message : String(error)}. The app needs the docker socket to create computers.`,
        );
    });

    const text = await res.text();
    let data: unknown = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    return {
        status: res.status,
        ok: res.ok,
        data: res.ok ? (data as T) : null,
        message: res.ok
            ? undefined
            : (data as { message?: string } | null)?.message || text || `HTTP ${res.status}`,
    };
}
