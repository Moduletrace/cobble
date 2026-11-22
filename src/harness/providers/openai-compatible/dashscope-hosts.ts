import HarnessError from "../../harness-error";

/**
 * Alibaba's native routes (images, speech) live at the host root, beside
 * `<base>/compatible-mode/v1`, never under it.
 */
export const NativeGenerationPath = "/api/v1/services/aigc/multimodal-generation/generation";

/**
 * The host root: the native routes live beside `<base>/compatible-mode/v1`,
 * never under it.
 */
export function dashScopeOrigin({ base_url }: { base_url: string }) {
    try {
        return new URL(base_url).origin;
    } catch {
        throw new HarnessError({
            message: `The provider's base URL can't be read as an address: ${base_url}`,
            retryable: false,
        });
    }
}

/**
 * Alibaba's Token Plan host. Its models are served only by the native
 * calls; the compatible routes 404, and trying one first benches the model
 * before the request that works.
 */
export function isTokenPlanHost({ base_url }: { base_url?: string | null }) {
    if (!base_url) return false;

    try {
        return new URL(base_url).hostname.startsWith("token-plan.");
    } catch {
        return false;
    }
}

/**
 * A DashScope or Model Studio host, where the native calls take the
 * provider's own extensions (`image` references, audio input). The shared
 * `dashscope` hosts and the workspace `maas` hosts both count; a custom
 * provider pointed elsewhere keeps the standard behaviour.
 */
export function isDashScopeHost({ base_url }: { base_url?: string | null }) {
    if (!base_url) return false;

    try {
        const host = new URL(base_url).hostname;

        return (
            host == "dashscope.aliyuncs.com" ||
            host == "dashscope-intl.aliyuncs.com" ||
            host.endsWith(".maas.aliyuncs.com")
        );
    } catch {
        return false;
    }
}