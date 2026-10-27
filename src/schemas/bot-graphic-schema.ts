import { z } from "zod";

export const BotGraphicIdSchema = z.object({
    graphic_id: z.coerce.number().int().positive("Pick a graphic"),
});
