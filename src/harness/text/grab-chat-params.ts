import {
    HarnessParameters,
    harnessParameterValue,
    modelAdvertisesParameter,
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
 * harness's setting (the workspace's, the bot's, else the default), else
 * `HarnessParameterDefaults` so a fresh install is ready to go. Keyed by
 * the field sent on the wire, keeping only what the model says it takes
 * (a default only where the model explicitly advertises it). `source`
 * says whose setting it was, for the call's usage row.
 */
export default async function grabChatParams({
    harness,
    bot_id,
    workspace_id,
}: Params): Promise<{
    paramsFor: (model: HarnessModelInfo) => Record<string, number | string | { effort: string }>;
    source: "default" | "bot" | "workspace";
}> {
    const setting = await grabHarnessSetting({
        harness,
        bot_id,
        workspace_id,
    });

    const paramsFor = (model: HarnessModelInfo) =>
        Object.fromEntries(
            HarnessParameters.flatMap((parameter) => {
                const { value, saved } = harnessParameterValue({
                    harness,
                    params: setting.options,
                    key: parameter.key,
                });

                if (typeof value != "number" && typeof value != "string") return [];
                if (!value && value !== 0) return [];
                if (
                    !modelTakesParameter({
                        parameter,
                        supported: model.supported_parameters,
                    })
                )
                    return [];
                if (
                    !saved &&
                    !modelAdvertisesParameter({
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

    return { paramsFor, source: setting.source };
}
