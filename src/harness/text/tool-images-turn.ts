import { ToolImagesNote } from "@/src/data/harness-prompts";
import type { HarnessContentPart, HarnessToolImage } from "../types";

type Params = {
    /**
     * Each tool call's images, in the order the calls ran.
     */
    shown: { tool_name: string; images: HarnessToolImage[] }[];
};

/**
 * The user turn carrying the images a round of tool calls returned: tool
 * messages carry text only, so they follow the results, each image after
 * the name of the tool that took it.
 */
export default function toolImagesTurn({ shown }: Params): HarnessContentPart[] {
    return [
        { type: "text", text: ToolImagesNote },
        ...shown.flatMap(({ tool_name, images }) =>
            images.flatMap((image, index): HarnessContentPart[] => [
                {
                    type: "text",
                    text: `From ${tool_name}${images.length > 1 ? ` (${index + 1} of ${images.length})` : ""}:`,
                },
                { type: "image", ...image },
            ]),
        ),
    ];
}
