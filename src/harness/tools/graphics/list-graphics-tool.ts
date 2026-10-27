import { z } from "zod";
import listBotGraphics from "@/src/functions/backend/db/bot-graphics/list-bot-graphics";
import graphicRef from "@/src/utils/graphic-ref";
import type { HarnessTool } from "../../types";
import type { GraphicToolContext } from "./graphic-tool-context";

type Args = {
    limit?: number;
};

/**
 * Lets a bot find the graphics it made for this user here, newest first,
 * so it changes one rather than making it again.
 */
export default function listGraphicsTool(context: GraphicToolContext): HarnessTool<Args> {
    return {
        name: "list_graphics",
        description: `List the graphics you made for this user in this conversation's place, newest first. Check it before making a graphic the user may already have.`,
        schema: z.object({
            limit: z.number().int().min(1).max(50).optional(),
        }),
        run: async ({ args }) => {
            const graphics = await listBotGraphics({
                bot_id: context.bot_id,
                user_id: context.user_id,
                workspace_id: context.workspace_id,
                limit: args.limit,
            });

            if (!graphics.length) return `You haven't made any graphics for this user here.`;

            return graphics
                .map(
                    (graphic) =>
                        `- ${graphicRef({ id: graphic.id })} "${graphic.title}", version ${graphic.version || 1}, ${graphic.chars} characters, updated ${new Date(Number(graphic.updated_at)).toUTCString()}`,
                )
                .join("\n");
        },
    };
}
