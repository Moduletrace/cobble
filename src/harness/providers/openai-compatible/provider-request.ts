import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessProviderConfig } from "../../types";
import grabProviderHeaders from "../grab-provider-headers";
import grabProviderPreset from "../grab-provider-preset";
import toHarnessError from "../to-harness-error";

type Params = {
    provider: HarnessProviderConfig;
    /**
     * Appended to the provider's base URL, e.g. `/chat/completions`.
     */
    path: string;
    method?: "GET" | "POST";
    json?: unknown;
    form?: FormData;
    signal?: AbortSignal;
    timeout_ms?: number;
    /**
     * Replaces the provider's base URL for this call, for a route that lives
     * at the host root (Alibaba's native `api/v1/services/aigc/...` API is
     * not under the provider's `/compatible-mode/v1` base).
     */
    base_url?: string;
    /**
     * Deadline for the whole body once the headers are in. Defaults to a
     * generous span so a streamed answer isn't cut off by the header timeout.
     */
    body_timeout_ms?: number;
    candidate_key?: string;
};

/**
 * One HTTP call to a provider. Resolves with the response when it's OK;
 * otherwise throws a `HarnessError` (`aborted` when the caller cancelled,
 * retryable for timeouts and network failures).
 *
 * The request timeout bounds only the wait for the headers. The body keeps
 * its own generous deadline, and a read that fails mid-body is turned into a
 * `HarnessError` here rather than escaping as a raw abort exception the
 * fallback loop can't classify (M2).
 */
export default async function providerRequest({
    provider,
    path,
    method = "POST",
    json,
    form,
    signal,
    timeout_ms = AppData.HarnessRequestTimeoutMs,
    body_timeout_ms = AppData.HarnessBodyTimeoutMs,
    base_url,
    candidate_key,
}: Params): Promise<Response> {
    const provider_name =
        provider.name || grabProviderPreset({ kind: provider.kind }).title;
    const url = `${(base_url || provider.base_url).replace(/\/+$/, "")}${path}`;
    const headers = grabProviderHeaders({ provider });

    if (json !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const on_abort = () => controller.abort();

    signal?.addEventListener("abort", on_abort, { once: true });

    if (signal?.aborted) controller.abort();

    let timer = setTimeout(() => controller.abort(), timeout_ms);
    let phase: "headers" | "body" = "headers";

    const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", on_abort);
    };

    const fail = (error: unknown): HarnessError => {
        if (signal?.aborted) {
            return new HarnessError({ message: `Cancelled.`, code: "aborted", candidate_key });
        }

        const message =
            phase == "headers"
                ? controller.signal.aborted
                    ? `${provider_name} took too long to answer at ${method} ${url}.`
                    : `Couldn't reach ${provider_name} at ${method} ${url}: ${error instanceof Error ? error.message : String(error)}`
                : `${provider_name} stopped sending the response.`;

        return new HarnessError({
            message,
            retryable: true,
            candidate_key,
            method,
            url,
            timed_out: phase == "headers" && controller.signal.aborted,
        });
    };

    let res: Response;

    try {
        res = await fetch(url, {
            method,
            headers,
            body: form || (json !== undefined ? JSON.stringify(json) : undefined),
            signal: controller.signal,
        });
    } catch (error: unknown) {
        cleanup();
        throw fail(error);
    }

    phase = "body";
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), body_timeout_ms);

    if (!res.ok) {
        let body = "";

        try {
            body = await res.text();
        } catch (error: unknown) {
            cleanup();
            throw fail(error);
        }

        cleanup();

        throw toHarnessError({
            status: res.status,
            body,
            headers: res.headers,
            provider_name,
            candidate_key,
            method,
            url,
        });
    }

    if (!res.body) {
        cleanup();
        return res;
    }

    // Read the body through a stream of our own so a mid-stream abort comes
    // back as a HarnessError the fallback loop understands, and the deadline
    // and listener are released however the read ends.
    const reader = res.body.getReader();
    const body = new ReadableStream<Uint8Array>({
        async pull(stream) {
            try {
                const { done, value } = await reader.read();

                if (done) {
                    cleanup();
                    stream.close();
                    return;
                }

                if (value) stream.enqueue(value);
            } catch (error: unknown) {
                cleanup();
                stream.error(fail(error));
            }
        },
        cancel(reason) {
            cleanup();
            return reader.cancel(reason);
        },
    });

    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}
