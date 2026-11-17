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
        // Never follow a redirect (M11): the headers may carry secrets, and
        // the redirect's target is not the URL the tool was set up with.
        redirect: "manual",
        signal: AbortSignal.any([
            signal,
            AbortSignal.timeout(
                Math.min(config.timeout_ms || AppData.CustomToolDefaultTimeoutMs, AppData.CustomToolMaxTimeoutMs),
            ),
        ]),
    });

    if (res.status >= 300 && res.status < 400) {
        throw new Error(
            `The tool's API answered HTTP ${res.status}, a redirect. It isn't followed: the request's headers may carry secrets, and the redirect's target isn't the configured URL.`,
        );
    }

    const { text: raw, truncated } = await readBody({ res, max_bytes: AppData.CustomToolResponseMaxBytes });
    const text = prettify({ text: raw });
    const shown = truncated ? `${text}\n\n[The answer was cut at ${AppData.CustomToolResponseMaxBytes} bytes.]` : text;

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}${shown ? `: ${shown.slice(0, 4000)}` : ""}`);
    }

    return shown || `HTTP ${res.status}, no body.`;
}

/**
 * Reads the answer up to a byte cap (M11), so an endless body can't fill
 * memory; says when it was cut.
 */
async function readBody({ res, max_bytes }: { res: Response; max_bytes: number }): Promise<{ text: string; truncated: boolean }> {
    if (!res.body) return { text: "", truncated: false };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let total = 0;
    let truncated = false;

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > max_bytes) {
                truncated = true;
                await reader.cancel();
                break;
            }
            text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
    } catch {
        // A body that breaks mid-read keeps what already arrived.
    }

    return { text, truncated };
}

function prettify({ text }: { text: string }) {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return text.trim();
    }
}
