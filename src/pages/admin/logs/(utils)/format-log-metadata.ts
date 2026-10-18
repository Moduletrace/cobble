type Params = {
    metadata?: string | null;
};

/**
 * Pretty-print JSON metadata, falling back to the raw string.
 */
export default function formatLogMetadata({ metadata }: Params) {
    if (!metadata) return undefined;

    try {
        return JSON.stringify(JSON.parse(metadata), null, 2);
    } catch {
        return metadata;
    }
}
