import { z } from "zod";
import { AppData } from "@/src/data/app-data";

const Id = z.coerce.number().int().positive();

export const SaveKnowledgebaseRequestSchema = z.object({
    knowledgebase_id: Id.optional(),
    name: z.string().trim().min(1, "Enter a name").max(80),
    description: z.string().trim().max(1000).default(""),
    enabled: z.boolean().default(true),
    all_bots: z.boolean().default(false),
});

export type SaveKnowledgebaseRequest = z.infer<typeof SaveKnowledgebaseRequestSchema>;

export const KnowledgebaseIdRequestSchema = z.object({
    knowledgebase_id: Id,
});

export const KnowledgebaseDocumentIdRequestSchema = z.object({
    document_id: Id,
});

/**
 * A file for a knowledgebase, as a data URL.
 */
export const UploadKnowledgebaseDocumentRequestSchema = z.object({
    knowledgebase_id: Id,
    name: z.string().trim().min(1).max(200),
    data_url: z.string().min(1).startsWith("data:"),
});

/**
 * Text written into a knowledgebase: a new document, or a change to one.
 */
export const SaveKnowledgebaseTextRequestSchema = z.object({
    knowledgebase_id: Id,
    document_id: Id.optional(),
    name: z.string().trim().min(1, "Enter a title").max(200),
    content: z
        .string()
        .trim()
        .min(1, "Write something")
        .max(AppData.KnowledgebaseTextMaxChars, `Up to ${AppData.KnowledgebaseTextMaxChars} characters`),
});

export type SaveKnowledgebaseTextRequest = z.infer<typeof SaveKnowledgebaseTextRequestSchema>;
