import { SiteData } from "@/src/data/site-data";
import type { HarnessProviderConfig } from "../types";

type Params = {
    provider: HarnessProviderConfig;
};

/**
 * Auth and attribution headers for a provider call.
 */
export default function grabProviderHeaders({
    provider,
}: Params): Record<string, string> {
    const headers: Record<string, string> = {};

    if (provider.api_key) {
        headers["Authorization"] = `Bearer ${provider.api_key}`;
    }

    switch (provider.kind) {
        case "openrouter":
            headers["HTTP-Referer"] = SiteData["SiteURL"];
            headers["X-Title"] = SiteData["SiteName"];
            break;

        case "anthropic":
            if (provider.api_key) {
                headers["x-api-key"] = provider.api_key;
            }
            headers["anthropic-version"] = "2023-06-01";
            break;
    }

    return headers;
}
