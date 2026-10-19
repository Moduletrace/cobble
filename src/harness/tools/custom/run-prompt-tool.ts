import type { CustomToolPromptConfig } from "@/src/types";
import fillTemplate from "@/src/utils/fill-template";
import generateText from "../../text/generate-text";

type Params = {
    config: CustomToolPromptConfig;
    args: Record<string, unknown>;
    envs: { key: string; value: string }[];
    /**
     * Its models are used, like the run's.
     */
    bot_id?: number | string;
    workspace_id?: number | string | null;
    signal: AbortSignal;
};

/**
 * Fills the tool's prompt in and answers it with one text model turn (no
 * tools). Returns the answer.
 */
export default async function runPromptTool({ config, args, envs, bot_id, workspace_id, signal }: Params) {
    const result = await generateText({
        messages: [{ role: "user", content: fillTemplate({ template: config.prompt || "", args, envs }) }],
        bot_id,
        workspace_id,
        signal,
    });

    return result.text || "(no answer)";
}
