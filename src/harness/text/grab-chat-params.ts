import {
    HarnessParameters,
    modelTakesParameter,
} from "@/src/dict/harness-parameter-dict";
import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import type { HarnessModelInfo } from "../types";

type Params = {
    harness: "text" | "vision";
    bot_id?: number | string;
    workspace_id?: number | string | null;
};

/**
 * A model's generation settings for one call: what is saved in the
 * harness's setting (the workspace's, the bot's, else the default),
 * keyed by the field sent on the wire, keeping only what the model says it
 * takes. Empty when none are set, so the model gets its provider's
 * defaults.
 */
export default async function grabChatParams({
    harness,
    bot_id,
    workspace_id,
}: Params): Promise<
    (model: HarnessModelInfo) => Record<string, number | string | { effort: string }>
> {
    const setting = await grabHarnessSetting({
        harness,
        bot_id,
        workspace_id,
    });

    return (model) =>
        Object.fromEntries(
            HarnessParameters.flatMap((parameter) => {
                const value = setting.options[parameter.key];

                if (typeof value != "number" && typeof value != "string") return [];
                if (!value && value !== 0) return [];
                if (
                    !modelTakesParameter({
                        parameter,
                        supported: model.supported_parameters,
                    })
                )
                    return [];

                const key = "wire" in parameter ? parameter.wire : parameter.key;

                return [
                    [key, key == "reasoning" ? { effort: String(value) } : value],
                ];
            }),
        );
}
