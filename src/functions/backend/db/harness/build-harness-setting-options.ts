import { AppData } from "@/src/data/app-data";
import type { HarnessKind } from "@/src/dict/harness-dict";
import { withHarnessParameters } from "@/src/dict/harness-parameter-dict";
import AppError from "@/src/utils/app-error";
import assertHarnessModel from "./assert-harness-model";

type Params = {
    harness: HarnessKind;
    /**
     * The options the setting row holds now (`{}` for a new row).
     */
    existing: Record<string, unknown>;
    /**
     * The picked model, never also a fallback.
     */
    model_id: number | null;
    voice?: string;
    sees_images?: boolean;
    fallback_model_ids?: number[];
    params?: Record<string, number | string>;
};

/**
 * A harness setting's options as the settings forms save them: what the
 * row held beyond the form's own fields, then the voice (speech), whether
 * the text model reads images itself, the text harness's fallback models
 * (each checked like a pick, on any provider) and the generation settings.
 */
export default async function buildHarnessSettingOptions({
    harness,
    existing,
    model_id,
    voice,
    sees_images,
    fallback_model_ids = [],
    params = {},
}: Params) {
    const { voice: _voice, sees_images: _sees, fallback_model_ids: _fallbacks, ...options } = existing;
    const fallbacks =
        harness == "text" ? [...new Set(fallback_model_ids)].filter((id) => id != model_id) : [];

    if (fallbacks.length > AppData.HarnessTextFallbackModelsMax) {
        throw new AppError(`Pick at most ${AppData.HarnessTextFallbackModelsMax} fallback models.`);
    }

    for (const id of fallbacks) {
        await assertHarnessModel({ harness, model_id: id });
    }

    return withHarnessParameters({
        options: {
            ...options,
            ...(voice ? { voice } : {}),
            ...(harness == "text" && sees_images ? { sees_images: true } : {}),
            ...(fallbacks.length ? { fallback_model_ids: fallbacks } : {}),
        },
        params,
    });
}
