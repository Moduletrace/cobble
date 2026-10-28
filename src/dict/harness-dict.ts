/**
 * The harnesses: what a model is used for. Each harness has one model
 * setting (`harness_settings`). Text is the brain and can't be turned off;
 * the others are helpers it calls on. `automatic` ones pick a free model
 * themselves when none is picked; the rest (transcription, speech,
 * embeddings) are not available until one is, since free picks there
 * rarely work. `install_wide` ones take only the default setting (Settings
 * > Models): no bot or workspace can pick its own, since every vector they
 * write must come from the same model to be compared.
 */
export const Harnesses = [
    {
        title: "Text",
        value: "text",
        automatic: true,
        description: `Chats, plans and works on computers. Every bot thinks with it.`,
        required: true,
        install_wide: false,
    },
    {
        title: "Media reading",
        value: "vision",
        automatic: true,
        description: `Reads images, scans and screenshots for the text model when it can't see them itself.`,
        required: false,
        install_wide: false,
    },
    {
        title: "Transcription",
        value: "transcription",
        automatic: false,
        description: `Turns voice messages and recordings into text.`,
        required: false,
        install_wide: false,
    },
    {
        title: "Speech",
        value: "speech",
        automatic: false,
        description: `Reads bot replies aloud.`,
        required: false,
        install_wide: false,
    },
    {
        title: "Image generation",
        value: "image",
        automatic: true,
        description: `Makes images when a bot is asked for one.`,
        required: false,
        install_wide: false,
    },
    {
        title: "Image editing",
        value: "image_edit",
        automatic: false,
        description: `Makes images from reference images a bot passes on: a logo to rework, a style to follow, a photo to change. Until a model is picked here (or while it's off), image generation takes them.`,
        required: false,
        install_wide: false,
    },
    {
        title: "Embeddings",
        value: "embedding",
        automatic: false,
        description: `Turns the files bots save and every knowledgebase into vectors, so bots search them by meaning. One model for the whole install. Without one, searching falls back to plain text matching.`,
        required: false,
        install_wide: true,
    },
] as const;

export type HarnessKind = (typeof Harnesses)[number]["value"];

/**
 * Whether a harness takes only the install's default setting.
 */
export function isInstallWideHarness({ harness }: { harness: HarnessKind }) {
    return Boolean(Harnesses.find((h) => h.value == harness)?.install_wide);
}

/**
 * Harnesses that hand their work to another one instead of picking
 * models automatically: image editing goes to image generation while it
 * has no model (or is off), and after its model fails when fallback is on.
 */
export const HarnessFallbacks: Partial<Record<HarnessKind, HarnessKind>> = {
    image_edit: "image",
};

/**
 * The harness this one falls back to, if any.
 */
export function harnessFallsBackTo({ harness }: { harness: HarnessKind }) {
    return HarnessFallbacks[harness];
}

/**
 * The title of the harness this one falls back to, if any.
 */
export function harnessFallbackTitle({ harness }: { harness: HarnessKind }) {
    const to = HarnessFallbacks[harness];

    return to ? Harnesses.find((h) => h.value == to)?.title : undefined;
}

/**
 * The `app_settings` key holding the install's own limit on model turns in
 * one run (a task). Unset means `AppData.HarnessMaxToolSteps`.
 */
export const HarnessMaxToolStepsSettingKey = "harness_max_tool_steps";

/**
 * Vendors preferred for automatic picks, best first. Free models from any
 * other vendor come after these, and only if they look competent.
 */
export const AutoModelVendorPreference = [
    "deepseek",
    "qwen",
    "nvidia",
    "liquid",
] as const;

/**
 * Routers that pick a model themselves (e.g. `openrouter/free`). Used as
 * the last automatic pick, after every named model.
 */
export const AutoModelRouterSlugs = ["openrouter/free"];

/**
 * Models with one narrow job (moderation, embeddings, ranking). Never
 * picked automatically.
 */
export const SpecialistModelPattern =
    /guard|safety|moderation|embed|rerank|classif/i;

/**
 * Names of small variants, ranked after their bigger siblings.
 */
export const SmallModelPattern =
    /(?:^|[-_.:/])(nano|mini|small|lite|lightning|tiny|micro|xs)(?=$|[-_.:])/i;
