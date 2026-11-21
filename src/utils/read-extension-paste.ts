import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import {
    ExtensionBundleDocumentSchema,
    ExtensionBundleItemSchema,
    ExtensionBundleKinds,
} from "@/src/schemas/extension-bundle-schema";
import type { SaveKnowledgebaseRequest } from "@/src/schemas/knowledgebase-schema";
import type { SaveCustomToolRequest, SaveMcpServerRequest, SaveSkillRequest } from "@/src/schemas/extension-schema";
import type { ExtensionBundleDocument, ExtensionBundleItem, ExtensionBundleKind } from "@/src/types";
import extensionItemSchema from "./extension-item-schema";
import normalizeExtensionConfig from "./normalize-extension-config";

/**
 * What each kind is called on its own page, for the status line.
 */
export const ExtensionPasteLabels: Record<ExtensionBundleKind, { one: string; many: string; article: string }> = {
    mcp: { one: "MCP server", many: "MCP servers", article: "an" },
    tool: { one: "tool", many: "tools", article: "a" },
    skill: { one: "skill", many: "skills", article: "a" },
    knowledgebase: { one: "knowledgebase", many: "knowledgebases", article: "a" },
};

type ConfigByKind = {
    mcp: SaveMcpServerRequest;
    tool: SaveCustomToolRequest;
    skill: SaveSkillRequest;
    knowledgebase: SaveKnowledgebaseRequest;
};

/**
 * One item read from pasted JSON, as the form that adds that kind takes it.
 */
export type ExtensionPaste = {
    [Kind in ExtensionBundleKind]: {
        kind: Kind;
        key: string;
        item: ExtensionBundleItem;
        config: ConfigByKind[Kind];
        /**
         * Same-kind items after this one in the JSON: the form fills with
         * the first.
         */
        left: number;
    };
}[ExtensionBundleKind];

export type ExtensionPasteResult = { ok: true; paste: ExtensionPaste } | { ok: false; problem: string };

type ItemRead = { item?: ExtensionBundleItem; left?: number; problem?: string };

/**
 * The keys an item carries beside its config, when the kind itself isn't
 * written out.
 */
const ItemKeys = ["key", "config", "redacted", "env_keys", "notes", "documents"];

/**
 * JSON pasted into an Add form: a whole export, one item out of it, or the
 * configuration a save takes, read with the same schema the form saves
 * through, so a paste can never fill a form that would be refused.
 */
export default function readExtensionPaste({
    kind,
    text,
}: {
    kind: ExtensionBundleKind;
    text: string;
}): ExtensionPasteResult {
    const trimmed = text.trim();

    if (!trimmed) return { ok: false, problem: "Paste an export first." };
    if (trimmed.length > AppData.ExtensionBundleMaxBytes) {
        return { ok: false, problem: `That is over ${Math.round(AppData.ExtensionBundleMaxBytes / 1_000_000)} MB.` };
    }

    let value: unknown;

    try {
        value = JSON.parse(trimmed);
    } catch {
        return { ok: false, problem: "That isn't JSON yet." };
    }

    const values = bundleItems({ value });
    let read: ItemRead;

    if (values) read = pickItem({ values, kind });
    else if (isRecord(value) && isExtensionKind(value.kind)) read = pickItem({ values: [value], kind });
    else read = readRawConfig({ value, kind });

    if (!read.item) return { ok: false, problem: read.problem || "That can't be read." };

    const config = normalizeExtensionConfig({ kind, config: read.item.config });
    const parsed = extensionItemSchema({ kind }).safeParse(config);

    if (!parsed.success) {
        const labels = ExtensionPasteLabels[kind];
        return {
            ok: false,
            problem: `That isn't ${labels.article} ${labels.one} this app saves: ${issueText({ error: parsed.error })}.`,
        };
    }

    return {
        ok: true,
        paste: {
            kind,
            key: read.item.key,
            item: { ...read.item, config },
            config: parsed.data,
            left: read.left || 0,
        } as ExtensionPaste,
    };
}

/**
 * The items a pasted value holds: a whole export, an array of items, or
 * nothing (then the value is one item or a raw configuration).
 */
function bundleItems({ value }: { value: unknown }): unknown[] | undefined {
    if (Array.isArray(value)) return value;
    if (isRecord(value) && Array.isArray(value.items)) return value.items;

    return undefined;
}

/**
 * The first item of the wanted kind, and how many of that kind follow it.
 */
function pickItem({ values, kind }: { values: unknown[]; kind: ExtensionBundleKind }): ItemRead {
    const items: ExtensionBundleItem[] = [];
    let problem: string | undefined;
    let other: ExtensionBundleKind | undefined;

    for (const value of values) {
        if (!isRecord(value) || !isExtensionKind(value.kind)) continue;

        if (value.kind != kind) {
            other ||= value.kind;
            continue;
        }

        const parsed = ExtensionBundleItemSchema.safeParse(value);

        if (!parsed.success) {
            problem ||= `That isn't one of this app's exports: ${issueText({ error: parsed.error })}.`;
            continue;
        }

        items.push(parsed.data as ExtensionBundleItem);
    }

    const labels = ExtensionPasteLabels[kind];

    if (!items.length) {
        if (problem) return { problem };

        if (other) {
            const found = ExtensionPasteLabels[other];
            return {
                problem: `That is ${found.article} ${found.one} export; this form adds ${labels.article} ${labels.one}.`,
            };
        }

        return { problem: `That holds no ${labels.many}.` };
    }

    return { item: items[0], left: items.length - 1 };
}

/**
 * A configuration the form's save takes, with or without the item's own
 * fields around it. A tool's `kind` is `http`, `script` or `prompt`, so it
 * is never mistaken for an extension's kind.
 */
function readRawConfig({ value, kind }: { value: unknown; kind: ExtensionBundleKind }): ItemRead {
    if (!isRecord(value)) return { problem: "That isn't a configuration this app saves." };

    const wrapper =
        isRecord(value.config) && Object.keys(value).every((key) => ItemKeys.includes(key) || key == "kind");
    const config = wrapper ? value.config : value;

    if (!isRecord(config)) return { problem: "That isn't a configuration this app saves." };

    let documents: ExtensionBundleDocument[] = [];

    if (value.documents !== undefined) {
        const parsed = z
            .array(ExtensionBundleDocumentSchema)
            .max(AppData.ExtensionBundleMaxDocuments)
            .safeParse(value.documents);

        if (!parsed.success) {
            return { problem: `Its documents can't be read: ${issueText({ error: parsed.error })}.` };
        }

        documents = parsed.data as ExtensionBundleDocument[];
    }

    const key = typeof value.key == "string" ? value.key : typeof config.name == "string" ? config.name : "";

    return {
        item: {
            kind,
            key,
            config,
            redacted: stringList({ value: value.redacted }),
            env_keys: stringList({ value: value.env_keys }),
            notes: stringList({ value: value.notes }),
            documents,
        },
        left: 0,
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value == "object" && !Array.isArray(value);
}

function isExtensionKind(value: unknown): value is ExtensionBundleKind {
    return typeof value == "string" && (ExtensionBundleKinds as readonly string[]).includes(value);
}

function stringList({ value }: { value: unknown }): string[] {
    const parsed = z.array(z.string()).max(500).safeParse(value);

    return parsed.success ? parsed.data : [];
}

function issueText({ error }: { error: z.ZodError }): string {
    const issue = error.issues[0];

    if (!issue) return "unexpected shape";

    const where = issue.path.map(String).join(".");

    return where ? `${where}: ${issue.message}` : issue.message;
}