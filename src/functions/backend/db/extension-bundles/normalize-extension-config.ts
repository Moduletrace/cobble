import type { ExtensionBundleKind } from "@/src/types";

type Params = {
    kind: ExtensionBundleKind;
    config: Record<string, unknown>;
};

/**
 * A bundle's config as the row's own form would have it. A tool's arguments
 * are an object, but a bundle written by hand, or pulled straight out of a
 * database, can carry them as the JSON text of that object.
 */
export default function normalizeExtensionConfig({ kind, config }: Params): Record<string, unknown> {
    if (kind != "tool" || typeof config.parameters != "string") return config;

    try {
        const parameters: unknown = JSON.parse(config.parameters);

        if (!parameters || typeof parameters != "object" || Array.isArray(parameters)) return config;

        return { ...config, parameters };
    } catch {
        return config;
    }
}