import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * The table a database browser request asks for, by its own name.
 */
const TableField = z
    .string()
    .min(1, "Pick a table")
    .max(120, "That isn't a table name");

/**
 * `GET api/admin/database/records`: one page of one table's records.
 */
export const DatabaseRecordsRequestSchema = z.object({
    table: TableField.optional(),
    page: z.coerce.number().int().positive().default(1),
    search: z.string().max(200).optional(),
    mode: z.enum(["every_word", "phrase"]).default("every_word"),
});

export type DatabaseRecordsRequest = z.infer<typeof DatabaseRecordsRequestSchema>;

/**
 * `GET api/admin/database/record`: one record, by its key.
 */
export const DatabaseRecordRequestSchema = z.object({
    table: TableField,
    key: z
        .string()
        .min(1, "Pick a record")
        .max(AppData.DatabaseBrowserCellMaxChars, "That isn't a record key"),
});

export type DatabaseRecordRequest = z.infer<typeof DatabaseRecordRequestSchema>;
