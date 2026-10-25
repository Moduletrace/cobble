import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * The sandbox's REST address (no `/mcp`).
     */
    base_url: string;
    path: string;
    /**
     * A JSON body makes it a POST.
     */
    body?: Record<string, unknown>;
    timeout_ms?: number;
};

/**
 * One call to a computer's sandbox REST API (`/v1/...`). Returns its
 * JSON; throws when the computer can't be reached or refuses.
 */
export default async function callComputerApi({
    base_url,
    path,
    body,
    timeout_ms = AppData.McpConnectTimeoutMs,
}: Params): Promise<any> {
    const res = await fetch(`${base_url}${path}`, {
        method: body ? "POST" : "GET",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeout_ms),
    });
    const json: any = await res.json().catch(() => ({}));

    if (!res.ok || json?.success === false) {
        throw new Error(`The computer refused ${path}: ${json?.message || res.status}`);
    }

    return json;
}
