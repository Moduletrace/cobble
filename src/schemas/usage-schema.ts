import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * `GET api/admin/usage`: the period the usage page totals, in days back
 * from today. Left out, it is the page's default; past the limit, the
 * limit.
 */
export const UsageRequestSchema = z.object({
    days: z.coerce
        .number()
        .int()
        .positive()
        .max(AppData.UsageMaxDays, "That is too long a period")
        .optional(),
});

export type UsageRequest = z.infer<typeof UsageRequestSchema>;
