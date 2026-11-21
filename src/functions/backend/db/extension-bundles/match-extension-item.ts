/**
 * What a knowledgebase's existing documents look like, by name and size:
 * enough to tell one that changed from one that didn't, without reading
 * every document back.
 */
export type ExtensionDocumentFingerprint = {
    name: string;
    size: number;
};

/**
 * A row already here, as the import compares a bundle's item against it.
 */
export type ExistingExtensionItem = {
    id: number;
    key: string;
    config: Record<string, unknown>;
    /**
     * Whether the row reaches every bot: an overwrite keeps it, since an
     * import changes settings and never access.
     */
    all_bots?: boolean;
    documents?: ExtensionDocumentFingerprint[];
};

export type ExtensionMatchStatus = "new" | "same" | "conflict";

export type ExtensionMatch = {
    status: ExtensionMatchStatus;
    existing_id: number | null;
    /**
     * The config's top-level fields that differ, named, so the preview can
     * say what an overwrite would change.
     */
    differing: string[];
};

type Params = {
    key: string;
    config: Record<string, unknown>;
    existing: ExistingExtensionItem[];
};

/**
 * Fields a bundle never carries, so comparing them would only ever see the
 * importing install's own values.
 */
const IgnoredFields = ["all_bots", "mcp_server_id", "custom_tool_id", "skill_id", "knowledgebase_id"];

/**
 * Whether an item is one this install doesn't have, one it has exactly, or
 * one it has with different settings. The item's key is its natural
 * identity: a server's or skill's slug, a tool's name, a knowledgebase's
 * name lowercased.
 */
export default function matchExtensionItem({ key, config, existing }: Params): ExtensionMatch {
    const match = existing.find((row) => row.key == key);

    if (!match) return { status: "new", existing_id: null, differing: [] };

    const here = comparable({ config });
    const there = comparable({ config: match.config });
    const fields = new Set([...Object.keys(here), ...Object.keys(there)]);
    const differing = [...fields]
        .filter((field) => JSON.stringify(here[field]) !== JSON.stringify(there[field]))
        .sort();

    return {
        status: differing.length ? "conflict" : "same",
        existing_id: match.id,
        differing,
    };
}

/**
 * A config with the fields a bundle never carries taken out and every
 * object's keys sorted, so two equal configs serialize the same however
 * they were written.
 */
function comparable({ config }: { config: Record<string, unknown> }): Record<string, unknown> {
    return sorted(
        Object.fromEntries(Object.entries(config).filter(([field]) => !IgnoredFields.includes(field))),
    ) as Record<string, unknown>;
}

function sorted(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sorted);

    if (value && typeof value == "object") {
        return Object.fromEntries(
            Object.keys(value)
                .sort()
                .map((key) => [key, sorted((value as Record<string, unknown>)[key])]),
        );
    }

    return value;
}