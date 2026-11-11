type Params = {
    /**
     * Default configuration for this harness when inherited.
     */
    harness_default?: {
        enabled?: boolean;
        current?: { name: string; provider_name: string } | null;
    };
    /**
     * Fallback title for harnesses that fall back to another harness.
     */
    falls_back_title?: string;
};

/**
 * Computes a human-readable description of the default model setting
 * for a harness when a bot or workspace inherits its configuration.
 */
export default function harnessDefaultName({
    harness_default,
    falls_back_title,
}: Params): string {
    // If the default is explicitly disabled
    if (harness_default?.enabled === false) {
        return "turned off";
    }

    // If a default model is active
    if (harness_default?.current) {
        return `${harness_default.current.name} on ${harness_default.current.provider_name}`;
    }

    // If it falls back to another harness (e.g. media reading falls back to text)
    if (falls_back_title) {
        return `same as ${falls_back_title.toLowerCase()}`;
    }

    return "not available";
}
