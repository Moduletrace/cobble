import HarnessError from "../harness-error";
import parseRetryAt from "./parse-retry-at";
import redactProviderError from "./redact-provider-error";

type Params = {
    status: number;
    /**
     * Response body text, usually JSON with an `error`.
     */
    body?: string;
    headers?: Headers;
    provider_name: string;
    candidate_key?: string;
    /**
     * The request that failed, when the caller knows it: without the address
     * a 404 with an empty body reads as "HTTP 404" and nothing else, and a
     * bot explaining it invented a routing story (production, Nov 2026).
     */
    method?: string;
    url?: string;
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
    method = "POST",
    url,
}: Params) {
    // The provider may echo the request's key in its error (LiteLLM does on
    // a 401); this text reaches members, the logs and the next model, so the
    // key's shapes are masked before it goes anywhere (M8).
    const provider_detail = readErrorMessage({ body });
    const detail = redactProviderError({ text: provider_detail || `HTTP ${status}` }),
        /**
         * A 404 or a 405 with nothing in the body is the provider's gateway
         * saying the path does not exist (Alibaba's Token Plan host serves
         * chat but has no `/images/generations`), never a problem with the
         * prompt or the model.
         */
        missing_endpoint = !provider_detail && (status == 404 || status == 405),
        address = addressText({ detail, method, url }),
        hint = missing_endpoint ? " - no endpoint at that address; check the provider's base URL" : "";

    const retryable = [408, 409, 425, 429].includes(status) || status >= 500;

    return new HarnessError({
        message: redactProviderError({ text: `${provider_name}: ${detail}${address}${hint}` }).slice(0, 400),
        status,
        retryable,
        retry_at: retryable && headers ? parseRetryAt({ headers }) : undefined,
        provider_wide: status == 401 || status == 402,
        candidate_key,
        method,
        url,
    });
}

/**
 * Where the call went, unless the provider's own words already say it.
 */
function addressText({ detail, method, url }: { detail: string; method: string; url?: string }) {
    if (!url || detail.includes(url)) return "";

    return ` at ${method} ${url}`;
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