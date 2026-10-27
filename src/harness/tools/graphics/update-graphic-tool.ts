import { z } from "zod";
import updateBotGraphic from "@/src/functions/backend/db/bot-graphics/update-bot-graphic";
import graphicRef from "@/src/utils/graphic-ref";
import type { HarnessTool } from "../../types";
import { GraphicAuthoringNote } from "./graphic-authoring-note";
import type { GraphicToolContext } from "./graphic-tool-context";

type Args = {
    graphic_id: number;
    title?: string;
    html?: string;
};

/**
 * Lets a bot replace a graphic it made for this user. Every message
 * naming it shows the new version.
 */
export default function updateGraphicTool(context: GraphicToolContext): HarnessTool<Args> {
    return {
        name: "update_graphic",
        description: `Change a graphic you made for this user: new html replaces the whole document (read_graphic first to start from the current one), a new title renames it. Every message showing it shows the new version. ${GraphicAuthoringNote}`,
        schema: z.object({
            graphic_id: z.number().int().positive().describe("The ID from its [graphic:ID] ref"),
            title: z.string().trim().min(1).max(200).optional(),
            html: z.string().min(1).optional().describe("The whole new document"),
        }),
        run: async ({ args }) => {
            const version = await updateBotGraphic({
                graphic_id: args.graphic_id,
                bot_id: context.bot_id,
                user_id: context.user_id,
                title: args.title,
                html: args.html,
            });
            const ref = graphicRef({ id: args.graphic_id });

            context.onGraphic?.({ ref });

            return `Updated graphic ${args.graphic_id} (now version ${version}). Write ${ref} in your reply to show it again.`;
        },
    };
}
