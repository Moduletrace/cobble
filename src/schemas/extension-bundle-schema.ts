import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * The kinds one bundle holds, in the order a file lists them.
 */
export const ExtensionBundleKinds = ["mcp", "tool", "skill", "knowledgebase"] as const;

/**
 * A knowledgebase document as a bundle carries it: what it says, never its
 * bytes. A bot reads only text, and the passages a text is cut into belong
 * to the install that embedded them, so an import reads them again.
 */
export const ExtensionBundleDocumentSchema = z.object({
    name: z.string().trim().min(1).max(200),
    mime_type: z.string().trim().max(200).default("text/markdown"),
    text: z.string().max(AppData.KnowledgebaseTextMaxChars),
});

/**
 * One MCP server, tool, skill or knowledgebase: its natural key (what two
 * installs call the same thing), the configuration a save takes, what the
 * export left behind, and a knowledgebase's documents.
 */
export const ExtensionBundleItemSchema = z.object({
    kind: z.enum(ExtensionBundleKinds),
    key: z.string().trim().min(1).max(200),
    config: z.record(z.string(), z.unknown()),
    /**
     * Values the export left behind, named, e.g. "header Authorization".
     */
    redacted: z.array(z.string().max(200)).max(500).default([]),
    /**
     * The keys a run needs (`{{env.KEY}}`), for the import to check.
     */
    env_keys: z.array(z.string().max(200)).max(500).default([]),
    /**
     * What the export had to leave out or cut, said in the preview.
     */
    notes: z.array(z.string().max(300)).max(20).default([]),
    documents: z.array(ExtensionBundleDocumentSchema).max(AppData.ExtensionBundleMaxDocuments).default([]),
});

/**
 * A file of extensions taken from one install for another: what it is, the
 * version of the format, and the items themselves.
 */
export const ExtensionBundleSchema = z.object({
    format: z.literal("cobble-extensions"),
    version: z.literal(1),
    exported_at: z.number().int().nonnegative().default(0),
    app_version: z.string().trim().max(40).default(""),
    items: z.array(ExtensionBundleItemSchema).max(AppData.ExtensionBundleMaxItems),
});

/**
 * Sending a bundle to be compared with what the install has.
 */
export const PreviewExtensionImportRequestSchema = z.object({
    bundle: ExtensionBundleSchema,
    /**
     * The page it's imported from: only its own kind is previewed.
     */
    kind: z.enum(ExtensionBundleKinds),
});

/**
 * Importing it: the bundle, and what to do with each item.
 */
export const ApplyExtensionImportRequestSchema = PreviewExtensionImportRequestSchema.extend({
    decisions: z
        .array(
            z.object({
                index: z.number().int().nonnegative(),
                action: z.enum(["skip", "add", "overwrite", "copy"]),
            }),
        )
        .max(AppData.ExtensionBundleMaxItems)
        .default([]),
});

/**
 * Exporting from one page: the kind, and the rows picked (all when empty).
 */
export const ExportExtensionBundleRequestSchema = z.object({
    kind: z.enum(ExtensionBundleKinds),
    ids: z.array(z.coerce.number().int().positive()).max(AppData.ExtensionBundleMaxItems).default([]),
});

export type ExtensionBundleRequest = z.infer<typeof ExtensionBundleSchema>;
export type PreviewExtensionImportRequest = z.infer<typeof PreviewExtensionImportRequestSchema>;
export type ApplyExtensionImportRequest = z.infer<typeof ApplyExtensionImportRequestSchema>;
export type ExportExtensionBundleRequest = z.infer<typeof ExportExtensionBundleRequestSchema>;