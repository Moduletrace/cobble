import { z } from "zod";

/**
 * Delete one of a conversation's files.
 */
export const DeleteBotFileRequestSchema = z.object({
    file_id: z.coerce.number().int().positive(),
});

/**
 * The General settings' storage quota, in MB.
 */
export const SaveStorageQuotaRequestSchema = z.object({
    quota_mb: z.coerce.number().int().min(0).max(1_000_000),
});
