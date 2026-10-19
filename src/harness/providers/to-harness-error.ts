import HarnessError from "../harness-error";
import parseRetryAt from "./parse-retry-at";

type Params = {
    status: number;
    /**
     * Response body text, usually JSON with an `error`.
     */
    body?: string;
    headers?: Headers;
    provider_name: string;
    candidate_key?: string;
};

/**
 * Turns a failed provider response into a `HarnessError`:
 * - 401: bad key; 402: out of credits. Every model on the provider fails
 *   the same way, so it is `provider_wide`
 * - 408, 409, 425, 429, 5xx: `retryable`, with `retry_at` when the
 *   provider says
 * - anything else (400, 403, 404, 422): only another model can help. A
 *   403 is about the model (OpenRouter refuses some free models to most
 *   apps), not the key
 */
export default function toHarnessError({
    status,
    body,
    headers,
    provider_name,
    candidate_key,
}: Params) {
    const detail = readErrorMessage({ body }) || `HTTP ${status}`;
    const retryable = [408, 409, 425, 429].includes(status) || status >= 500;

    return new HarnessError({
        message: `${provider_name}: ${detail}`.slice(0, 400),
        status,
        retryable,
        retry_at: retryable && headers ? parseRetryAt({ headers }) : undefined,
        provider_wide: status == 401 || status == 402,
        candidate_key,
    });
}

function readErrorMessage({ body }: { body?: string }) {
    if (!body) return undefined;

    try {
        const json = JSON.parse(body);
        const error = json?.error ?? json;

        if (typeof error == "string") return error;

        const raw = error?.metadata?.raw;
        const message = error?.message || json?.message || json?.detail;

        if (typeof message == "string") {
            return typeof raw == "string" && !message.includes(raw)
                ? `${message} (${raw.slice(0, 200)})`
                : message;
        }
    } catch {}

    return body.trim().slice(0, 200) || undefined;
}
