import type { CustomToolPromptConfig } from "@/src/types";
import fillTemplate from "@/src/utils/fill-template";
import generateText from "../../text/generate-text";

type Params = {
    config: CustomToolPromptConfig;
    args: Record<string, unknown>;
    envs: { key: string; value: string; secret?: boolean }[];
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
    /**
     * The filled template IS the model's input here, so a secret value
     * filled into it would pass through the model - which secrets never do.
     * A secret env fills in as its `[KEY]` marker (the same one
     * `redactSecrets` writes on the way out), never its value: the model
     * sees that a secret exists, not what it is (R1). HTTP and script tools
     * use a secret server-side, in the request or the script's environment,
     * where its value never reaches the model.
     */
    const prompt_envs = envs.map((env) => ({
        key: env.key,
        value: env.secret ? `[${env.key}]` : env.value,
    }));

    const result = await generateText({
        messages: [
            { role: "user", content: fillTemplate({ template: config.prompt || "", args, envs: prompt_envs }) },
        ],
        bot_id,
        workspace_id,
        signal,
    });

    return result.text || "(no answer)";
}
