import { z } from "zod";

/**
 * Delete one of a conversation's files.
 */
export const DeleteBotFileRequestSchema = z.object({
    file_id: z.coerce.number().int().positive(),
});

/**
 * Read one file again so it can be searched.
 */
export const IngestBotFileRequestSchema = z.object({
    file_id: z.coerce.number().int().positive(),
    read_media: z.boolean().optional(),
});

/**
 * The General settings' storage quota, in MB.
 */
export const SaveStorageQuotaRequestSchema = z.object({
    quota_mb: z.coerce.number().int().min(0).max(1_000_000),
});
