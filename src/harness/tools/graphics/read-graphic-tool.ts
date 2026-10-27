import { z } from "zod";
import grabBotGraphic from "@/src/functions/backend/db/bot-graphics/grab-bot-graphic";
import type { HarnessTool } from "../../types";
import type { GraphicToolContext } from "./graphic-tool-context";

type Args = {
    graphic_id: number;
};

/**
 * Lets a bot read the HTML of a graphic it made for this user, to edit it.
 */
export default function readGraphicTool(context: GraphicToolContext): HarnessTool<Args> {
    return {
        name: "read_graphic",
        description: `Read the HTML of a graphic you made for this user, to change it with update_graphic.`,
        schema: z.object({
            graphic_id: z.number().int().positive().describe("The ID from its [graphic:ID] ref"),
        }),
        run: async ({ args }) => {
            const graphic = await grabBotGraphic({ graphic_id: args.graphic_id, user_id: context.user_id });

            if (!graphic || Number(graphic.bot_id) != Number(context.bot_id)) {
                return `Graphic ${args.graphic_id} isn't one you made for this user.`;
            }

            return `Graphic ${graphic.id}, "${graphic.title}" (version ${graphic.version || 1}):\n\n${graphic.html || ""}`;
        },
    };
}
