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
    candidate_key?: string;
};

/**
 * One HTTP call to a provider. Resolves with the response when it's OK;
 * otherwise throws a `HarnessError` (`aborted` when the caller cancelled,
 * retryable for timeouts and network failures).
 */
export default async function providerRequest({
    provider,
    path,
    method = "POST",
    json,
    form,
    signal,
    timeout_ms = AppData.HarnessRequestTimeoutMs,
    candidate_key,
}: Params): Promise<Response> {
    const provider_name =
        provider.name || grabProviderPreset({ kind: provider.kind }).title;
    const timeout = AbortSignal.timeout(timeout_ms);
    const headers = grabProviderHeaders({ provider });

    if (json !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    let res: Response;

    try {
        res = await fetch(`${provider.base_url.replace(/\/+$/, "")}${path}`, {
            method,
            headers,
            body: form || (json !== undefined ? JSON.stringify(json) : undefined),
            signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        });
    } catch (error: unknown) {
        if (signal?.aborted) {
            throw new HarnessError({
                message: `Cancelled.`,
                code: "aborted",
                candidate_key,
            });
        }

        throw new HarnessError({
            message: timeout.aborted
                ? `${provider_name} took too long to answer.`
                : `Couldn't reach ${provider_name}: ${error instanceof Error ? error.message : String(error)}`,
            retryable: true,
            candidate_key,
        });
    }

    if (!res.ok) {
        throw toHarnessError({
            status: res.status,
            body: await res.text().catch(() => ""),
            headers: res.headers,
            provider_name,
            candidate_key,
        });
    }

    return res;
}
