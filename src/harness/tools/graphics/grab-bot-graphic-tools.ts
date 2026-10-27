import type { HarnessTool } from "../../types";
import createGraphicTool from "./create-graphic-tool";
import type { GraphicToolContext } from "./graphic-tool-context";
import listGraphicsTool from "./list-graphics-tool";
import readGraphicTool from "./read-graphic-tool";
import updateGraphicTool from "./update-graphic-tool";

/**
 * The tools a bot makes visuals with (`src/harness/tools/graphics/`):
 * making, changing, reading and listing the HTML graphics it made for the
 * run's user. Every run gets them; they need no computer, since the app
 * stores and serves graphics itself.
 */
export default function grabBotGraphicTools(context: GraphicToolContext): HarnessTool[] {
    return [
        createGraphicTool(context),
        updateGraphicTool(context),
        readGraphicTool(context),
        listGraphicsTool(context),
    ];
}
