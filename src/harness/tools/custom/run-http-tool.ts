import { AppData } from "@/src/data/app-data";
import type { CustomToolHttpConfig } from "@/src/types";
import fillTemplate from "@/src/utils/fill-template";

type Params = {
    config: CustomToolHttpConfig;
    args: Record<string, unknown>;
    envs: { key: string; value: string }[];
    signal: AbortSignal;
};

/**
 * Calls the tool's API from the app: URL (arguments URL-encoded), headers
 * and body filled in from the arguments and envs. With no body template,
 * anything but GET sends the arguments as JSON. Returns the response (JSON
 * pretty-printed); a non-2xx answer throws with its status and body.
 */
export default async function runHttpTool({ config, args, envs, signal }: Params) {
    const fill = (template: string, encode?: (value: string) => string) =>
        fillTemplate({ template, args, envs, encode });

    const method = config.method || "GET";
    const headers = new Headers(
        Object.entries(config.headers || {}).map(([key, value]) => [key, fill(value)] as [string, string]),
    );
    const body =
        method == "GET" ? undefined : config.body?.trim() ? fill(config.body) : JSON.stringify(args);

    if (body && !headers.has("content-type")) headers.set("content-type", "application/json");

    const res = await fetch(fill(config.url, encodeURIComponent), {
        method,
        headers,
        body,
        signal: AbortSignal.any([
            signal,
            AbortSignal.timeout(
                Math.min(config.timeout_ms || AppData.CustomToolDefaultTimeoutMs, AppData.CustomToolMaxTimeoutMs),
            ),
        ]),
    });

    const text = prettify({ text: await res.text() });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 4000)}` : ""}`);
    }

    return text || `HTTP ${res.status}, no body.`;
}

function prettify({ text }: { text: string }) {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return text.trim();
    }
}
