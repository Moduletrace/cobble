import { z } from "zod";
import createBotGraphic from "@/src/functions/backend/db/bot-graphics/create-bot-graphic";
import graphicRef from "@/src/utils/graphic-ref";
import type { HarnessTool } from "../../types";
import { GraphicAuthoringNote } from "./graphic-authoring-note";
import type { GraphicToolContext } from "./graphic-tool-context";

type Args = {
    title: string;
    html: string;
};

/**
 * Lets a bot make a visual (a chart, diagram, timeline, comparison or
 * illustrated explainer) as HTML the chat shows inline. Stored in the app
 * (`bot_graphics`), so it needs no computer.
 */
export default function createGraphicTool(context: GraphicToolContext): HarnessTool<Args> {
    return {
        name: "create_graphic",
        description: `Make a visual for the user, shown inline in the chat: a chart, diagram, flow, timeline, comparison table, dashboard or illustrated explainer. Use it when a picture makes something clearer than text does; keep the reply's words short beside it. ${GraphicAuthoringNote} Write the [graphic:ID] ref it returns in your reply where it should show. To change it later, update_graphic it rather than making another.`,
        schema: z.object({
            title: z.string().trim().min(1).max(200).describe(`What it shows, e.g. "Q3 revenue by region"`),
            html: z.string().min(1).describe("The document"),
        }),
        run: async ({ args }) => {
            const id = await createBotGraphic({
                user_id: context.user_id,
                bot_id: context.bot_id,
                session_id: context.session_id,
                workspace_id: context.workspace_id,
                job_id: context.job_id,
                title: args.title,
                html: args.html,
            });
            const ref = graphicRef({ id });

            context.onGraphic?.({ ref });

            return `Made graphic ${id}, "${args.title.trim()}". Write ${ref} in your reply where it should show; the user sees it there.`;
        },
    };
}
