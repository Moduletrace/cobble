import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * `POST api/admin/settings/app-networks`: the whole list of extra docker
 * networks the app's container joins (Settings > General). Names are
 * checked by `checkAppNetworks`.
 */
export const SaveAppNetworksRequestSchema = z.object({
    networks: z
        .array(z.string().max(128))
        .max(AppData.AppExtraNetworksMax * 2),
});

export type SaveAppNetworksRequest = z.infer<typeof SaveAppNetworksRequestSchema>;
