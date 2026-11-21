import type {
    ExtensionBundle,
    ExtensionBundleItem,
    ExtensionBundleKind,
    ExtensionImportPreview,
    ExtensionImportPreviewItem,
    ExtensionImportStatus,
} from "@/src/types";
import hasEnvTemplate from "@/src/utils/has-env-template";
import extensionItemSchema from "./extension-item-schemas";
import grabExistingExtensionItems from "./grab-existing-extension-items";
import matchExtensionItem, { type ExistingExtensionItem } from "./match-extension-item";
import missingEnvKeys from "./missing-env-keys";
import normalizeExtensionConfig from "./normalize-extension-config";

type Params = {
    bundle: ExtensionBundle;
    kind: ExtensionBundleKind;
};

/**
 * What importing this file's items of one kind would do, item by item:
 * which is new here, which is already here exactly, which is here with
 * different settings, and which can't be read at all. Nothing is written.
 */
export default async function previewExtensionImport({ bundle, kind }: Params): Promise<ExtensionImportPreview> {
    const existing = await grabExistingExtensionItems({ kind });
    const counts: Record<ExtensionImportStatus, number> = { new: 0, same: 0, conflict: 0, invalid: 0 };
    const items: ExtensionImportPreviewItem[] = [];

    for (const [index, item] of bundle.items.entries()) {
        if (item.kind != kind) continue;

        const preview = await previewItem({ index, item, existing });

        counts[preview.status]++;
        items.push(preview);
    }

    return {
        kind,
        exported_at: bundle.exported_at,
        app_version: bundle.app_version,
        counts,
        items,
        other_kinds: bundle.items.filter((item) => item.kind != kind).length,
    };
}

type PreviewItemParams = {
    index: number;
    item: ExtensionBundleItem;
    existing: ExistingExtensionItem[];
};

async function previewItem({ index, item, existing }: PreviewItemParams): Promise<ExtensionImportPreviewItem> {
    const base: ExtensionImportPreviewItem = {
        index,
        kind: item.kind,
        key: item.key,
        name: typeof item.config.name == "string" ? item.config.name : item.key,
        status: "new",
        existing_id: null,
        differing: [],
        problem: "",
        warnings: [...item.notes],
        redacted: item.redacted,
        env_keys: item.env_keys,
        document_count: item.documents.length,
        copy_only: false,
    };

    const config = normalizeExtensionConfig({ kind: item.kind, config: item.config });

    const parsed = extensionItemSchema({ kind: item.kind }).safeParse(config);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];

        return {
            ...base,
            status: "invalid",
            problem: issue
                ? issue.path.length
                    ? `${issue.path.join(".")}: ${issue.message}`
                    : issue.message
                : "The item can't be read.",
        };
    }

    if (parsed.data.name) base.name = parsed.data.name;

    const match = matchExtensionItem({ key: item.key, config, existing });
    const warnings = [...base.warnings];

    if (item.kind == "knowledgebase" && match.status == "same" && item.documents.length) {
        const row = existing.find((candidate) => candidate.id == match.existing_id);
        const here = fingerprints(row?.documents || []);
        const there = fingerprints(item.documents.map((document) => ({ name: document.name, size: Buffer.byteLength(document.text, "utf8") })));

        if (here != there) {
            match.status = "conflict";
            match.differing = ["documents"];
            warnings.push("Its documents here are different, and an overwrite adds the file's beside them.");
        }
    }

    const same_name = item.kind == "knowledgebase" ? existing.filter((row) => row.key == item.key).length : 0;

    if (same_name > 1) {
        warnings.push(`${same_name} knowledgebases here already have this name, so it can only be imported as a copy.`);
    }

    if (item.kind == "mcp") {
        const url = typeof config.url == "string" ? config.url : "";
        const other = url && !hasEnvTemplate({ values: [url] })
            ? existing.find((row) => row.key != item.key && row.config.url === url)
            : undefined;

        if (other) warnings.push(`${String(other.config.name || other.key)} already uses this URL.`);
    }

    if (item.kind == "tool") {
        const other = existing.find((row) => row.key != item.key && row.key.toLowerCase() == item.key.toLowerCase());

        if (other) warnings.push(`A tool named ${other.key} is already here; names are case-sensitive.`);
    }

    const missing = await missingEnvKeys({ keys: item.env_keys });

    if (missing.length) {
        warnings.push(`Keys to add in Settings > Environment: ${missing.join(", ")}.`);
    }

    if (item.redacted.length) {
        warnings.push(`Left out of the file: ${item.redacted.join(", ")}. Add them on the row after importing.`);
    }

    return {
        ...base,
        status: same_name > 1 ? "conflict" : match.status,
        existing_id: match.existing_id,
        differing: match.differing,
        warnings,
        copy_only: same_name > 1,
    };
}

/**
 * Documents as one comparable line: names and sizes in order, so two sets
 * with the same documents read the same however they were added.
 */
function fingerprints(documents: { name: string; size: number }[]): string {
    return documents
        .map((document) => `${document.name}:${document.size}`)
        .sort()
        .join("|");
}