import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { StorageVolumeDefs } from "@/src/utils/storage-volumes";

const VolumeField = z.enum(
    StorageVolumeDefs.map((def) => def.value) as [
        (typeof StorageVolumeDefs)[number]["value"],
        ...((typeof StorageVolumeDefs)[number]["value"])[],
    ],
);

/**
 * The volume and owner a storage request asks for. The owner is left out
 * for the database, which has one folder.
 */
const StorageTargetFields = {
    volume: VolumeField,
    owner: z.coerce.number().int().nonnegative().default(0),
};

/**
 * `GET api/admin/storage/list`: one folder on the data volume.
 */
export const StorageListRequestSchema = z.object({
    ...StorageTargetFields,
    path: z.string().max(AppData.BotFilePathMaxChars).optional(),
    search: z.string().max(120).optional(),
    offset: z.coerce.number().int().nonnegative().default(0),
});

export type StorageListRequest = z.infer<typeof StorageListRequestSchema>;

/**
 * `GET api/admin/storage/file`: one file's bytes.
 */
export const StorageFileRequestSchema = z.object({
    ...StorageTargetFields,
    path: z.string().min(1, "Pick a file").max(AppData.BotFilePathMaxChars),
});

export type StorageFileRequest = z.infer<typeof StorageFileRequestSchema>;
