import { AppData } from "@/src/data/app-data";
import {
    AutoModelRouterSlugs,
    AutoModelVendorPreference,
    SmallModelPattern,
    SpecialistModelPattern,
    type HarnessKind,
} from "@/src/dict/harness-dict";
import type { HarnessCatalogModel } from "../types";
import modelServesHarness from "./model-serves-harness";
import parseModelSize from "./parse-model-size";

type Params<T extends HarnessCatalogModel> = {
    models: T[];
    harness: HarnessKind;
    /**
     * Unix ms, for retired models. Defaults to now.
     */
    now?: number;
};

/**
 * The free models a harness picks automatically, best first:
 * 1. `AutoModelVendorPreference` in order (DeepSeek, Qwen, NVIDIA, Liquid)
 * 2. any other vendor's model that looks competent (text and vision only)
 * 3. routers such as `openrouter/free`, last
 *
 * Within a group, benchmarked models come first by intelligence index,
 * then the rest: full-size before small variants, newest first.
 */
export default function rankAutoModels<T extends HarnessCatalogModel>({
    models,
    harness,
    now = Date.now(),
}: Params<T>): T[] {
    const ranked = models
        .filter(
            (model) =>
                model.free &&
                !(model.expires_at && model.expires_at <= now) &&
                !SpecialistModelPattern.test(model.slug) &&
                modelServesHarness({ model, harness }),
        )
        .map((model) => ({ model, tier: grabTier({ model, harness }) }))
        .filter(
            (entry): entry is { model: T; tier: number } =>
                entry.tier !== undefined,
        );

    return ranked
        .sort(
            (a, b) =>
                (harness == "transcription"
                    ? Number(!isSpeechToText(a.model)) -
                      Number(!isSpeechToText(b.model))
                    : 0) ||
                a.tier - b.tier ||
                compareInTier(a.model, b.model),
        )
        .map((entry) => entry.model);
}

/**
 * Dedicated speech-to-text models transcribe before chat models that hear
 * audio: some free chat endpoints list audio input but drop it.
 */
function isSpeechToText(model: HarnessCatalogModel) {
    return model.output_modalities.includes("transcription");
}

const OtherTier = AutoModelVendorPreference.length;
const RouterTier = OtherTier + 1;

/**
 * Undefined drops the model.
 */
function grabTier({
    model,
    harness,
}: {
    model: HarnessCatalogModel;
    harness: HarnessKind;
}) {
    const slug = model.slug.toLowerCase();

    if (AutoModelRouterSlugs.includes(slug)) {
        return RouterTier;
    }

    const name = slug.split("/").pop() || slug;
    const vendor_tier = AutoModelVendorPreference.findIndex(
        (vendor) => slug.startsWith(`${vendor}/`) || name.startsWith(vendor),
    );

    if (vendor_tier >= 0) {
        return vendor_tier;
    }

    if (harness != "text" && harness != "vision") {
        return OtherTier;
    }

    return isCompetent({ model }) ? OtherTier : undefined;
}

function isCompetent({ model }: { model: HarnessCatalogModel }) {
    if (
        model.context_length &&
        model.context_length < AppData.HarnessAutoMinContext
    ) {
        return false;
    }

    if (model.intelligence_score !== undefined) {
        return model.intelligence_score >= AppData.HarnessAutoMinScore;
    }

    const size = parseModelSize({ slug: model.slug });

    return (
        !SmallModelPattern.test(model.slug) &&
        (size === undefined || size >= AppData.HarnessAutoMinSizeB)
    );
}

function compareInTier(a: HarnessCatalogModel, b: HarnessCatalogModel) {
    const a_scored = a.intelligence_score !== undefined;
    const b_scored = b.intelligence_score !== undefined;

    if (a_scored != b_scored) {
        return a_scored ? -1 : 1;
    }

    if (a_scored && b_scored) {
        const by_score =
            (b.intelligence_score || 0) - (a.intelligence_score || 0) ||
            (b.agentic_score || 0) - (a.agentic_score || 0);

        if (by_score) return by_score;
    }

    const a_small = isSmall(a);
    const b_small = isSmall(b);

    if (a_small != b_small) {
        return a_small ? 1 : -1;
    }

    return (
        (b.released_at || 0) - (a.released_at || 0) ||
        (b.context_length || 0) - (a.context_length || 0) ||
        a.slug.localeCompare(b.slug)
    );
}

function isSmall(model: HarnessCatalogModel) {
    const size = parseModelSize({ slug: model.slug });

    return (
        SmallModelPattern.test(model.slug) ||
        (size !== undefined && size < AppData.HarnessAutoMinSizeB)
    );
}
