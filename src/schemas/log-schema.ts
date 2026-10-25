import { z } from "zod";
import { LogCategories } from "@/src/dict/log-categories";

const LogCategoryValues = LogCategories.map((lc) => lc.value) as [
    (typeof LogCategories)[number]["value"],
    ...(typeof LogCategories)[number]["value"][],
];

/**
 * `POST api/admin/logs/clear-logs`: deletes every log in one category, or
 * every log when it is left out (the "All" tab).
 */
export const ClearLogsRequestSchema = z.object({
    category: z.enum(LogCategoryValues).optional(),
});

export type ClearLogsRequest = z.infer<typeof ClearLogsRequestSchema>;
