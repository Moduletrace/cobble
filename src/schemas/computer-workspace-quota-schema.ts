import { z } from "zod";

/**
 * The General settings' computer workspace limit, in MB. Zero means the
 * install sets no limit.
 */
export const SaveComputerWorkspaceQuotaRequestSchema = z.object({
    quota_mb: z.coerce.number().int().min(0).max(10_000_000),
});